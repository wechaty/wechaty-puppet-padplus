import { FileBox } from 'file-box'

import flatten  from 'array-flatten'

import path from 'path'

import util from 'util'

import LRU from 'lru-cache'

import { v4 as uuid } from 'uuid'

import {
  ContactGender,
  ContactPayload,
  ContactType,

  FriendshipPayload,

  MessagePayload,
  MessageType,

  Puppet,
  PuppetOptions,

  Receiver,

  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,

  UrlLinkPayload,
  MiniProgramPayload,
  ScanStatus,
}                           from 'wechaty-puppet'

import {
  GRPC_ENDPOINT,
  log,
  macproToken,
  MESSAGE_CACHE_AGE,
  MESSAGE_CACHE_MAX,
  qrCodeForChatie,
  retry,
  VERSION,
}                                   from './config'

import { DelayQueueExecutor } from 'rx-queue'

import {
  GrpcPrivateMessagePayload,
  MacproMessageType,
  MiniProgram,
  RequestStatus,
  GrpcFriendshipRawPayload,
  GrpcPublicMessagePayload,
  GrpcLoginInfo,
  MacproMessagePayload,
  AddFriendBeforeAccept,
  MacproFriendInfo,
  MacproUrlLink,
} from './schemas'

import { RequestClient } from './utils/request'
import { CacheManageError, NoIDError } from './utils/errorMsg'
import { MacproContactPayload, ContactList, GrpcContactPayload, AliasModel } from './schemas/contact'
import { CacheManager } from './cache-manager'
import { GrpcGateway } from './gateway/grpc-api'
import MacproContact from './mac-api/contact'
import MacproUser from './mac-api/user'
import MacproMessage from './mac-api/message'
import { MacproRoomPayload, GrpcRoomMemberPayload, MacproRoomInvitationPayload, GrpcRoomPayload, MacproCreateRoom, GrpcRoomQrcode, GrpcRoomDetailInfo, GrpcRoomMember, MacproRoomMemberPayload } from './schemas/room'
import MacproRoom from './mac-api/room'
import {
  fileBoxToQrcode,
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
  isStrangerV1,
  messageRawPayloadParser,
  newFriendMessageParser,
} from './pure-function-helpers'
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser'
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser'
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser'
import { messageUrlPayloadParser } from './pure-function-helpers/message-url-payload-parser'

const PRE = 'PUPPET_MACPRO'

let num = 0

export class PuppetMacpro extends Puppet {

  public static readonly VERSION = VERSION

  private readonly cacheMacproMessagePayload: LRU<string, MacproMessagePayload>

  private loopTimer?: NodeJS.Timer

  private cacheManager?: CacheManager

  private grpcGateway: GrpcGateway

  private requestClient: RequestClient

  private contact: MacproContact

  private user: MacproUser

  private message: MacproMessage

  private room: MacproRoom

  private apiQueue: DelayQueueExecutor

  private addFriendCB: {[id: string]: any} = {}

  constructor (
    public options: PuppetOptions = {},
  ) {
    super(options)
    const lruOptions: LRU.Options<string, MacproMessagePayload> = {
      dispose (key: string, val: any) {
        log.silly(PRE, `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      },
      max: MESSAGE_CACHE_MAX,
      maxAge: MESSAGE_CACHE_AGE,
    }

    this.cacheMacproMessagePayload = new LRU<string, MacproMessagePayload>(lruOptions)

    const token = options.token || macproToken()
    if (token) {
      this.grpcGateway = new GrpcGateway(token, GRPC_ENDPOINT)
      this.requestClient = new RequestClient(this.grpcGateway)
      this.contact = new MacproContact(this.requestClient)
      this.user = new MacproUser(token, this.requestClient)
      this.message = new MacproMessage(this.requestClient)
      this.room = new MacproRoom(this.requestClient)
      const min = 0.5
      this.apiQueue = new DelayQueueExecutor(/* Math.max(min, Math.random() * 2) * 1000 */min * 1000)
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {
    log.silly(PRE, `start()`)

    this.state.on('pending')

    this.grpcGateway.on('reconnect', async () => {
      await this.stop()
      await this.start()
    })

    this.grpcGateway.on('scan', async dataStr => {
      log.verbose(PRE, `
      ======================================
                   grpc on scan
      ======================================
      `)
      log.info(PRE, `Please scan this qrcode for login WeChat.`)

      const data = JSON.parse(dataStr)

      const fileBox = FileBox.fromUrl(data.url)
      const url = await fileBoxToQrcode(fileBox)
      this.emit('scan', url, ScanStatus.Cancel)
    })

    this.grpcGateway.on('login', async dataStr => {
      log.verbose(PRE, `
      ======================================
                 grpc on login
      ======================================
      `)
      const data: GrpcLoginInfo = JSON.parse(dataStr)
      log.silly(PRE, `
      ========================================
      login data : ${util.inspect(data)}
      ========================================
      `)
      const wxid = data.account_alias

      log.verbose(PRE, `init cache manager`)
      await CacheManager.init(wxid)
      this.cacheManager = CacheManager.Instance

      const selfPayload: MacproContactPayload = {
        account: data.account,
        accountAlias: data.account_alias || data.account,
        area: '',
        description: '',
        disturb: '',
        formName: '',
        name: data.name,
        sex: ContactGender.Unknown,
        thumb: data.thumb,
        v1: '',
      }
      await this.cacheManager.setContact(selfPayload.accountAlias, selfPayload)
      if (data.account_alias) {
        await this.cacheManager.setAccountWXID(selfPayload.account, selfPayload.accountAlias)
      }
      await this.login(wxid)

    })

    this.grpcGateway.on('message', data => this.onProcessMessage(JSON.parse(data)))

    this.grpcGateway.on('contact-list', data => this.setContactToCache(data))

    this.grpcGateway.on('room-member', async memberStr => {
      num++
      log.silly(PRE, `
      ======================================================
      room member times : ${num}
      ======================================================
      `)
      const members: GrpcRoomMemberPayload[] = JSON.parse(memberStr).memberList
      const macproMembers: MacproRoomMemberPayload[] = []
      let payload: { [contactId: string]: MacproRoomMemberPayload } = {}
      members.map(async member => {
        await this.apiQueue.execute(async () => {
          if (member.userName) {
            const roomMemberPayload: MacproRoomMemberPayload = {
              account: member.userName,
              accountAlias: member.userName,
              area: '',
              description: '',
              disturb: '',
              formName: member.displayName,
              name: member.nickName,
              sex: ContactGender.Unknown,
              thumb: member.bigHeadImgUrl,
              v1: '',
            }
            macproMembers.push(roomMemberPayload)
            payload[member.userName] = roomMemberPayload
            if (!this.cacheManager) {
              throw CacheManageError('ROOM-MEMBER')
            }

            const _contact = await this.cacheManager.getContact(member.userName)
            if (!_contact) {
              const contact: MacproContactPayload = {
                account: member.userName,
                accountAlias: member.userName,
                area: '',
                description: '',
                disturb: '',
                formName: member.displayName,
                name: member.nickName,
                sex: ContactGender.Unknown,
                thumb: member.bigHeadImgUrl,
                v1: '',
              }
              await this.cacheManager.setContact(member.userName, contact)
            }
            await this.cacheManager.setRoomMember(member.number, payload)

          } else {
            log.silly(PRE, `can not get member user name`)
          }
        })
      })

      const roomId = members[0].number
      if (!this.cacheManager) {
        throw CacheManageError('ROOM-MEMBER')
      }
      const room = await this.cacheManager.getRoom(roomId)
      if (!room) {
        throw new Error(`can not find room info by room id: ${roomId}`)
      }
      room.members = macproMembers

      await this.cacheManager.setRoom(room.number, room)

    })

    this.grpcGateway.on('logout', async () => {
      log.verbose(PRE, `
      ======================================
                 grpc on logout
      ======================================
      `)

      await this.logout()
    })

    this.grpcGateway.on('not-login', async (dataStr: string) => {
      log.verbose(PRE, `
      ======================================
               grpc on not-login
      ======================================
      `)
      log.silly(PRE, `dataStr : ${util.inspect(dataStr)}`)

      await retry(async (retryException) => {
        return this.user.getWeChatQRCode(retryException)
      }, 3)

    })

    this.grpcGateway.on('new-friend', async (dataStr: string) => {
      const friendshipRawPayload: GrpcFriendshipRawPayload = JSON.parse(dataStr)
      log.silly(PRE, `
      ===============================
      friendship raw payload: ${JSON.stringify(friendshipRawPayload)}
      ===============================
      `)
      const id = uuid()
      if (!this.cacheManager) {
        log.verbose(`Can not save friendship raw payload to cache since cache manager is not inited.`)
        return
      }
      const payload = friendshipReceiveEventMessageParser(friendshipRawPayload)
      if (payload) {
        await this.cacheManager.setFriendshipRawPayload(id, payload)
        this.emit('friendship', id)
      }
    })

    this.grpcGateway.on('add-friend-before-accept', (dataStr: string) => {
      log.silly(PRE, `add friend data : ${util.inspect(JSON.parse(dataStr))}`)

      const data: AddFriendBeforeAccept = JSON.parse(dataStr)
      const phoneOrAccount = data.phone || data.to_name

      if (!this.id) {
        throw NoIDError(`add-friend-before-accept`)
      }
      const unique = this.id + phoneOrAccount
      const cb = this.addFriendCB[unique]
      if (cb) {
        const friendInfo: MacproFriendInfo = {
          friendAccount: data.to_name,
          friendPhone: data.phone,
          friendThumb: data.to_thumb,
          myAccount: data.my_account,
        }
        cb(friendInfo)
      }
    })

    await this.grpcGateway.notify('getLoginUserInfo')

    this.state.on(true)
  }

  protected async login (selfId: string): Promise<void> {
    log.verbose(PRE, `login success, loading contact and room data.`)
    await super.login(selfId)

    const contactStatus = await this.contact.contactList(selfId)
    if (contactStatus === RequestStatus.Fail) {
      throw new Error(`load contact list failed.`)
    }
    await this.getAllRoom(selfId)

  }

  private async getAllRoom (selfId: string): Promise<void> {
    log.verbose(PRE, `getAllRoom()`)

    const pageRoom: GrpcRoomPayload[] = await this.room.roomList(selfId)
    log.verbose(PRE, `room number: ${pageRoom.length}`)

    await this.getRoomDetailInfo(pageRoom)

  }

  private async getRoomDetailInfo (allRoom: GrpcRoomPayload[]): Promise<void> {
    log.verbose(PRE, `getRoomDetailInfo()`)

    allRoom.forEach(async r => {
      await this.apiQueue.execute(async () => {
        if (!this.id) {
          throw NoIDError('getRoomDetailInfo()')
        }

        const room: MacproRoomPayload = {
          disturb: r.disturb,
          members: [],
          name: r.name,
          number: r.number,
          owner: r.author,
          thumb: r.thumb,
        }
        if (!this.cacheManager) {
          throw CacheManageError('getRoomDetailInfo()')
        }
        await this.cacheManager.setRoom(r.number, room)

        await this.room.roomMember(this.id, r.number)
      })
    })
  }

  protected async onProcessMessage (messagePayload: GrpcPrivateMessagePayload | GrpcPublicMessagePayload) {

    log.verbose(PRE, `onProcessMessage()`)
    log.silly(PRE, `message payload : ${JSON.stringify(messagePayload)}`)
    const contentType = messagePayload.content_type

    if (!contentType) {
      const contactPayload = newFriendMessageParser(messagePayload as any)
      if (this.cacheManager && contactPayload !== null) {
        await this.saveContactRawPayload(contactPayload)
      }
      return
    }

    const messageId = uuid()

    const payload: MacproMessagePayload = {
      ...messagePayload,
      content_type: contentType,
      messageId,
      timestamp: messagePayload.send_time,
    }

    // Cache message for future usage
    this.cacheMacproMessagePayload.set(messageId, payload)

    /**
     * Save account and account_alias info into contact
     */
    if (this.cacheManager && payload.to_account) {
      if (payload.to_account_alias) { // to_account 表示微信号 to_account_alias 表示wxid
        const wxid = payload.to_account_alias
        const cacheContact = await this.cacheManager.getContact(wxid)
        if (cacheContact) {
          cacheContact.accountAlias = wxid
          cacheContact.account = payload.to_account
          await this.cacheManager.setContact(wxid, cacheContact)
        } else {
          const contact: MacproContactPayload = {
            account: payload.to_account,
            accountAlias: wxid,
            area: '',
            description: '',
            disturb: '',
            formName: payload.to_name,
            name: payload.to_name,
            sex: ContactGender.Unknown,
            thumb: '',
            v1: '',
          }
          await this.cacheManager.setContact(wxid, contact)
        }
        await this.cacheManager.setAccountWXID(payload.to_account, payload.to_account_alias)
      } else { // to_account 表示 wxid
        const wxid = payload.to_account
        const cacheContact = await this.cacheManager.getContact(wxid)
        if (cacheContact) {
          cacheContact.accountAlias = wxid
          cacheContact.account = wxid
          await this.cacheManager.setContact(wxid, cacheContact)
        } else {
          const contact: MacproContactPayload = {
            account: wxid,
            accountAlias: wxid,
            area: '',
            description: '',
            disturb: '',
            formName: payload.to_name,
            name: payload.to_name,
            sex: ContactGender.Unknown,
            thumb: '',
            v1: '',
          }
          await this.cacheManager.setContact(wxid, contact)
        }
      }
    }

    const messageType = payload.content_type

    switch (messageType) {

      case MacproMessageType.Text:
        const textEventMatches = await Promise.all([
          this.onMacproMessageFriendshipEvent(payload),
        ])
        /**
         * If no event matched above, then emit the message
         */
        if (!textEventMatches.reduce((prev, cur) => prev || cur, false)) {
          this.emit('message', messageId)
        }
        break

      case MacproMessageType.Image:
      case MacproMessageType.Voice:
      case MacproMessageType.Video:
      case MacproMessageType.File:
        this.emit('message', messageId)
        break

      case MacproMessageType.PublicCard:
      case MacproMessageType.PrivateCard:
        this.emit('message', messageId)
        break

      case MacproMessageType.UrlLink:
        log.silly(PRE, `TODO UrlLink`)
        this.emit('message', messageId)
        break

      case MacproMessageType.System:
        const systemEventMatches = await Promise.all([
          this.onMacproMessageFriendshipEvent(payload),
          /* ----------------------------------------- */
          this.onMacproMessageRoomEventJoin(payload),
          this.onMacproMessageRoomEventLeave(payload),
          this.onMacproMessageRoomEventTopic(payload),
        ])
        /**
         * If no event matched above, then emit the message
         */
        if (!systemEventMatches.reduce((prev, cur) => prev || cur, false)) {
          this.emit('message', messageId)
        }
        break

      case MacproMessageType.MiniProgram:
        log.silly(PRE, `TODO MiniProgram message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.Location:
        log.silly(PRE, `TODO Location message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.RedPacket:
        log.silly(PRE, `TODO RedPacket message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.MoneyTransaction:
        log.silly(PRE, `TODO MoneyTransaction message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.Gif:
        log.silly(PRE, `TODO Gif`)
        this.emit('message', messageId)
        break

      default:
        this.emit('message', messageId)
        break
    }

  }

  public async setContactToCache (data: string): Promise<void> {
    log.verbose(PRE, `setContactToCache()`)

    const contactListInfo: ContactList = JSON.parse(data)
    const { currentPage, total, info } = contactListInfo

    await Promise.all(info.map(async (_contact: GrpcContactPayload) => {
      const contact: MacproContactPayload = {
        account: _contact.account,
        accountAlias: _contact.account_alias || _contact.account,
        area: _contact.area,
        description: _contact.description,
        disturb: _contact.disturb,
        formName: _contact.form_name,
        name: _contact.name,
        sex: parseInt(_contact.sex, 10) as ContactGender,
        thumb: _contact.thumb,
        v1: _contact.v1,
      }

      if (!this.cacheManager) {
        throw CacheManageError('setContactToCache()')
      }
      await this.saveContactRawPayload(contact)
    }))
    if (currentPage * 100 > total) {
      log.verbose(PRE, `contact data loaded. contact length: ${info.length}`)
    }
  }

  public async stop (): Promise<void> {

    log.silly(PRE, 'stop()')

    if (this.state.off()) {
      log.warn(PRE, 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    if (!this.id) {
      throw NoIDError('stop()')
    }
    await CacheManager.release()
    this.grpcGateway.removeAllListeners()
    await this.logout()
  }

  public async logout (): Promise<void> {

    log.silly(PRE, 'logout()')

    if (!this.id) {
      throw NoIDError('logout()')
    }
    await this.user.logoutWeChat(this.id)

    this.emit('logout', this.id) // be care we will throw above by logonoff() when this.user===undefined
    this.id = undefined
    this.state.off(true)

  }

  /**
   *
   * ContactSelf
   *
   *
   */
  public async contactSelfQrcode (): Promise<string> {
    log.verbose(PRE, 'contactSelfQrcode()')

    throw new Error('not supported')
  }

  public async contactSelfName (name: string): Promise<void> {
    log.verbose(PRE, 'contactSelfName(%s)', name)

    throw new Error('not supported')
  }

  public async contactSelfSignature (signature: string): Promise<void> {
    log.verbose(PRE, 'contactSelfSignature(%s)', signature)

    throw new Error('not supported')
  }

  /**
   *
   * Contact
   *
   */
  public async contactRawPayload (id: string): Promise<MacproContactPayload> {
    log.verbose(PRE, 'contactRawPayload(%s)', id)
    if (!this.cacheManager) {
      throw CacheManageError('contactRawPayload()')
    }
    if (!this.id) {
      throw NoIDError('contactRawPayload()')
    }

    let rawPayload = await this.cacheManager.getContact(id)
    if (!rawPayload) {
      const wxid = await this.cacheManager.getAccountWXID(id)
      if (wxid) {
        rawPayload = await this.cacheManager.getContact(wxid)
      }
    }

    if (!rawPayload) {
      const accountId = await this.getAccountId(id)
      if (accountId) {
        rawPayload = await this.contact.getContactInfo(this.id, id)
        await this.saveContactRawPayload(rawPayload)
      }
      log.silly(PRE, `contact rawPayload from API : ${util.inspect(rawPayload)}`)
      if (!rawPayload) {
        throw new Error(`can not find contact by wxid : ${id}`)
      }
    }

    return rawPayload
  }

  private async saveContactRawPayload (rawPayload: MacproContactPayload) {
    if (!this.cacheManager) {
      throw CacheManageError('saveContactRawPayload()')
    }
    if (rawPayload.accountAlias) {
      await this.cacheManager.setContact(rawPayload.accountAlias, rawPayload)
      if (rawPayload.account && rawPayload.account !== rawPayload.accountAlias) {
        await this.cacheManager.setAccountWXID(rawPayload.account, rawPayload.accountAlias)
      }
    } else if (rawPayload.account) {
      await this.cacheManager.setContact(rawPayload.account, rawPayload)
    } else {
      log.silly(PRE, `
      ============================================================
      bad raw payload : ${util.inspect(rawPayload)}
      ============================================================
      `)
      throw new Error(`bad raw payload`)
    }
  }

  public async contactRawPayloadParser (rawPayload: MacproContactPayload): Promise<ContactPayload> {
    log.verbose(PRE, 'contactRawPayloadParser()')

    const payload: ContactPayload = {
      address   : rawPayload.area,
      alias     : rawPayload.formName,
      avatar : rawPayload.thumb,
      city      : rawPayload.area,
      friend    : isStrangerV1(rawPayload.v1),
      gender : rawPayload.sex,
      id     : rawPayload.accountAlias || rawPayload.account,
      name   : rawPayload.name,
      province  : rawPayload.area,
      signature : rawPayload.description,
      type   : ContactType.Personal,
      weixin    : rawPayload.account,
    }
    return payload
  }

  public async contactPayloadDirty (contactId: string): Promise<void> {
    log.verbose(PRE, 'some one want to delete contact : %s', contactId)
  }

  public contactAlias (contactId: string)                      : Promise<string>
  public contactAlias (contactId: string, alias: string | null): Promise<void>

  public async contactAlias (contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose(PRE, 'contactAlias(%s, %s)', contactId, alias)

    if (!this.cacheManager) {
      throw CacheManageError('contactAlias()')
    }

    if (typeof alias === 'undefined') {
      const contact = await this.cacheManager.getContact(contactId)

      if (!contact) {
        throw new Error(`Can not find the contact by ${contactId}`)
      }

      return contact.formName
    } else {
      if (!this.id) {
        throw NoIDError(`contactAlias()`)
      }
      const aliasModel: AliasModel = {
        contactId,
        loginedId: this.id,
        remark: alias || '',
      }
      await this.contact.setAlias(aliasModel)
    }
  }

  public async contactList (): Promise<string[]> {
    log.verbose(PRE, 'contactList()')

    if (!this.cacheManager) {
      throw CacheManageError('contactList()')
    }

    return this.cacheManager.getContactIds()
  }

  public async contactQrcode (contactId: string): Promise<string> {
    if (contactId !== this.selfId()) {
      throw new Error('can not set avatar for others')
    }

    throw new Error('not supported')
  }

  public async contactAvatar (contactId: string)                : Promise<FileBox>
  public async contactAvatar (contactId: string, file: FileBox) : Promise<void>

  public async contactAvatar (contactId: string, file?: FileBox): Promise<void | FileBox> {
    log.verbose(PRE, 'contactAvatar(%s)', contactId)

    /**
     * 1. set
     */
    if (file) {
      throw new Error('not supported')
    }

    /**
     * 2. get
     */
    if (!this.cacheManager) {
      throw CacheManageError('contactAvatar()')
    }

    const contact = await this.cacheManager.getContact(contactId)

    if (!contact) {
      throw new Error(`Can not find the contact by ${contactId}`)
    }

    return FileBox.fromUrl(contact.thumb)
  }

  /**
   *
   * Message
   *
   */
  public async messageSendText (
    receiver : Receiver,
    text     : string,
    mentionIdList?: string[],
  ): Promise<void> {

    log.silly(PRE, 'messageSend(%s, %s)', JSON.stringify(receiver), text)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (this.id) {
      if (mentionIdList && mentionIdList.length > 0) {
        await this.room.atRoomMember(this.id, contactIdOrRoomId!, mentionIdList.join(','), text)
      } else {
        await this.message.sendMessage(this.id, contactIdOrRoomId!, text, MacproMessageType.Text)
      }
    } else {
      throw new Error('Can not get the logined account id')
    }

  }

  public async messageSendFile (
    receiver : Receiver,
    file     : FileBox,
  ): Promise<void> {
    log.verbose(PRE, 'messageSendFile(%s, %s)', receiver, file)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    const fileUrl = await this.generatorFileUrl(file)
    log.silly(PRE, `file url : ${util.inspect(fileUrl)}`)
    // this needs to run before mimeType is available
    await file.ready()

    const type = (file.mimeType && file.mimeType !== 'application/octet-stream')
      ? file.mimeType
      : path.extname(file.name)

    if (!this.id) {
      throw NoIDError('messageSendFile()')
    }

    log.silly(PRE, `fileType ${type}`)
    switch (type) {
      case '.slk':
        throw new Error('not support')
      case 'image/jpeg':
      case 'image/png':
      case '.jpg':
      case '.jpeg':
      case '.png':
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.Image)
        break
      case '.mp4':
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.Video)
        break
      default:
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.File, file.name)
        break
    }

  }

  private async generatorFileUrl (file: FileBox): Promise<string> {
    log.verbose(PRE, 'generatorFileUrl(%s)', file)
    const url = await this.requestClient.uploadFile(file.name, await file.toStream())
    return url
  }

  public async messageSendUrl (
    to: Receiver,
    urlLinkPayload: UrlLinkPayload
  ) : Promise<void> {
    log.verbose(PRE, 'messageSendUrl("%s", %s)',
      JSON.stringify(to),
      JSON.stringify(urlLinkPayload),
    )

    const contactIdOrRoomId =  to.roomId || to.contactId

    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload: MacproUrlLink = {
      description,
      thumbnailUrl,
      title,
      url,
    }
    if (!this.id) {
      throw NoIDError(`messageSendUrl()`)
    }
    await this.message.sendUrlLink(this.id, contactIdOrRoomId!, payload)
  }

  public async messageRawPayload (id: string): Promise<MacproMessagePayload> {
    log.verbose(PRE, 'messageRawPayload(%s)', id)

    const rawPayload = this.cacheMacproMessagePayload.get(id)
    if (!rawPayload) {
      throw new Error('no rawPayload')
    }

    return rawPayload
  }

  public async messageRawPayloadParser (rawPayload: MacproMessagePayload): Promise<MessagePayload> {
    log.verbose(PRE, 'messagePayload(%s)', rawPayload)

    const payload = await messageRawPayloadParser(rawPayload)

    return payload
  }

  private async onMacproMessageFriendshipEvent (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageFriendshipEvent({id=%s})', rawPayload.messageId)
    /**
     * 1. Look for friendship confirm event
     */
    const confirmPayload = friendshipConfirmEventMessageParser(rawPayload)
    /**
     * 2. Look for friendship verify event
     */
    const verifyPayload = friendshipVerifyEventMessageParser(rawPayload)

    if (confirmPayload || verifyPayload) {
      const payload = confirmPayload || verifyPayload
      if (this.cacheManager) {
        await this.cacheManager.setFriendshipRawPayload(rawPayload.messageId, payload!)
        this.emit('friendship', rawPayload.messageId)
        return true
      }
    }
    return false
  }

  private async onMacproMessageRoomEventJoin (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s})', rawPayload.messageId)

    const roomJoinEvent = await roomJoinEventMessageParser(rawPayload)

    if (roomJoinEvent) {
      const inviteeNameList = roomJoinEvent.inviteeNameList
      const inviterName     = roomJoinEvent.inviterName
      const roomId          = roomJoinEvent.roomId
      const timestamp       = roomJoinEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventJoin() roomJoinEvent="%s"', JSON.stringify(roomJoinEvent))

      const inviteeIdList = await retry(async (retryException, attempt) => {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s}) roomJoin retry(attempt=%d)', attempt)

        const tryIdList = flatten<string>(
          await Promise.all(
            inviteeNameList.map(
              inviteeName => this.roomMemberSearch(roomId, inviteeName),
            ),
          ),
        )

        if (tryIdList.length) {
          return tryIdList
        }

        /**
         * Set Cache Dirty
         */
        await this.roomMemberPayloadDirty(roomId)

        return retryException(new Error('roomMemberSearch() not found'))

      }).catch(e => {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
        return [] as string[]
      })

      const inviterIdList = await this.roomMemberSearch(roomId, inviterName)

      if (inviterIdList.length < 1) {
        throw new Error('no inviterId found')
      } else if (inviterIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin() inviterId found more than 1, use the first one.')
      }

      const inviterId = inviterIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-join', roomId, inviteeIdList,  inviterId, timestamp)
      return true
    }
    return false
  }

  private async onMacproMessageRoomEventLeave (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventLeave({id=%s})', rawPayload.messageId)

    const roomLeaveEvent = roomLeaveEventMessageParser(rawPayload)

    if (roomLeaveEvent) {
      const leaverNameList = roomLeaveEvent.leaverNameList
      const removerName    = roomLeaveEvent.removerName
      const roomId         = roomLeaveEvent.roomId
      const timestamp      = roomLeaveEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventLeave() roomLeaveEvent="%s"', JSON.stringify(roomLeaveEvent))

      const leaverIdList = flatten<string>(
        await Promise.all(
          leaverNameList.map(
            leaverName => this.roomMemberSearch(roomId, leaverName),
          ),
        ),
      )
      const removerIdList = await this.roomMemberSearch(roomId, removerName)
      if (removerIdList.length < 1) {
        throw new Error('no removerId found')
      } else if (removerIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventLeave(): removerId found more than 1, use the first one.')
      }
      const removerId = removerIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-leave', roomId, leaverIdList, removerId, timestamp)
      return true
    }
    return false
  }

  private async onMacproMessageRoomEventTopic (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventTopic({id=%s})', rawPayload.messageId)

    const roomTopicEvent = roomTopicEventMessageParser(rawPayload)

    if (roomTopicEvent) {
      const changerName = roomTopicEvent.changerName
      const newTopic    = roomTopicEvent.topic
      const roomId      = roomTopicEvent.roomId
      const timestamp   = roomTopicEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventTopic() roomTopicEvent="%s"', JSON.stringify(roomTopicEvent))

      const roomOldPayload = await this.roomPayload(roomId)
      const oldTopic       = roomOldPayload.topic

      const changerIdList = await this.roomMemberSearch(roomId, changerName)
      if (changerIdList.length < 1) {
        throw new Error('no changerId found')
      } else if (changerIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventTopic() changerId found more than 1, use the first one.')
      }
      const changerId = changerIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomPayloadDirty(roomId)

      this.emit('room-topic', roomId, newTopic, oldTopic, changerId, timestamp)
      return true
    }
    return false
  }

  public async messageSendContact (
    receiver  : Receiver,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'messageSend("%s", %s)', util.inspect(receiver), contactId)

    if (!this.id) {
      throw NoIDError('messageSendContact()')
    }

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    await this.message.sendContact(this.id, contactIdOrRoomId!, contactId)
  }

  // 发送小程序
  public async messageSendMiniProgram (
    receiver: Receiver,
    miniProgramPayload: MiniProgramPayload,
  ): Promise<void> {
    log.verbose(PRE, 'messageSendMiniProgram()')

    if (!this.id) {
      throw NoIDError('messageSendMiniProgram()')
    }
    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    const {
      username, // 小程序ID
      // appid, // 小程序关联的微信公众号ID  暂时不知道做啥用
      title,
      pagepath,
      description,
      thumbnailurl,
    } = miniProgramPayload

    const _miniProgram: MiniProgram = {
      app_name: username!,
      describe: description,
      my_account: this.id,
      page_path: pagepath,
      thumb_key: '',
      thumb_url: thumbnailurl,
      title: title!,
      to_account: contactIdOrRoomId!,
    }
    await this.message.sendMiniProgram(_miniProgram)
  }

  // TODO: 消息转发
  public async messageForward (
    receiver  : Receiver,
    messageId : string,
  ): Promise<void> {
    log.verbose(PRE, 'messageForward(%s, %s)',
      receiver,
      messageId,
    )

    const payload = await this.messagePayload(messageId)

    if (payload.type === MessageType.Text) {
      if (!payload.text) {
        throw new Error('no text')
      }
      await this.messageSendText(
        receiver,
        payload.text,
      )
    } else if (payload.type === MessageType.Audio) {
      throw new Error(`not support`)
    } else if (payload.type === MessageType.Url) {
      // TODO: currently this strips out the app information
      await this.messageSendUrl(
        receiver,
        await this.messageUrl(messageId)
      )
    } else if (payload.type === MessageType.MiniProgram) {
      // TODO: currently this strips out the app information
      await this.messageSendMiniProgram(
        receiver,
        await this.messageMiniProgram(messageId)
      )
    } else if (payload.type === MessageType.Video) {
      throw new Error(`not support`)
    } else if (
      payload.type === MessageType.Attachment
      || payload.type === MessageType.ChatHistory
    ) {
      throw new Error(`not support`)
    } else {
      await this.messageSendFile(
        receiver,
        await this.messageFile(messageId),
      )
    }
  }

  // TODO: 转发小程序
  public async messageMiniProgram (messageId: string)  : Promise<MiniProgramPayload> {
    log.verbose(PRE, 'messageUrl(%s)', messageId)

    return {
      title : 'Macpro title for ' + messageId,
      username: '',
    }
  }

  public async messageFile (id: string): Promise<FileBox> {
    if (!this.cacheManager) {
      throw new Error(`Can not get filebox from message since no cache manager.`)
    }
    const messagePayload = this.cacheMacproMessagePayload.get(id)
    if (!messagePayload) {
      throw new Error(`Can not get filebox from message since no message for id: ${id}.`)
    }
    const messageType = messagePayload.content_type
    const supportedMessageTypeToFileBox = [
      MacproMessageType.File,
      MacproMessageType.Image,
      MacproMessageType.Video,
      MacproMessageType.Voice,
    ]
    if (supportedMessageTypeToFileBox.includes(messageType)) {
      const fileBox = FileBox.fromUrl(messagePayload.content)
      if (messageType === MacproMessageType.Voice) {
        fileBox.metadata = {
          voiceLength: messagePayload.voice_len,
        }
      }
      return fileBox
    } else {
      throw new Error(`Can not get filebox for message type: ${MacproMessageType[messageType]}`)
    }
  }

  // TODO: 转发UrlLink
  public async messageUrl (messageId: string)  : Promise<UrlLinkPayload> {
    log.verbose(PRE, 'messageUrl(%s)')

    const payload = this.cacheMacproMessagePayload.get(messageId)
    if (!payload) {
      throw new Error(`Can not get url from message, since there is no message with id: ${messageId}`)
    }
    const urlLinkPayload = messageUrlPayloadParser(payload)

    if (!urlLinkPayload) {
      throw new Error(`Parse url link from message failed.`)
    }

    return urlLinkPayload
  }

  /**
   *
   * Room
   *
   */
  public async roomRawPayload (
    id: string,
  ): Promise<MacproRoomPayload> {
    log.verbose(PRE, 'roomRawPayload(%s)', id)

    if (!this.cacheManager) {
      throw CacheManageError('roomRawPayload()')
    }

    let rawPayload = await this.cacheManager.getRoom(id)

    if (!rawPayload || rawPayload.members.length === 0 || rawPayload.owner === '') {
      if (!this.id) {
        throw NoIDError(`roomRawPayload()`)
      }
      log.silly(PRE, `get room raw payload from API`)
      const roomDetail = await this.room.roomDetailInfo(this.id, id)
      if (roomDetail) {
        rawPayload = await this.convertRoomInfoFromGrpc(roomDetail)
        if (this.cacheManager) {
          await this.cacheManager.setRoom(id, rawPayload)
          const members = rawPayload.members
          const memberCache: { [memberId: string]: MacproRoomMemberPayload } = {}
          members.forEach(m => { memberCache[m.accountAlias] = m })
          await this.cacheManager.setRoomMember(id, memberCache)
        }
      } else {
        throw new Error(`no payload`)
      }
    }

    return rawPayload
  }

  private async convertRoomInfoFromGrpc (roomDetail: GrpcRoomDetailInfo): Promise<MacproRoomPayload> {
    log.silly(PRE, `convertRoomInfoFromGrpc()`)

    const _members: GrpcRoomMember[] = roomDetail.data
    const members: MacproRoomMemberPayload[] = []
    _members.map(m => {
      const member: MacproRoomMemberPayload = {
        account: m.account,
        accountAlias: m.account_alias || m.account,
        area: m.area,
        description: m.description,
        disturb: '',
        formName: m.my_name,
        name: m.name,
        sex: m.sex as ContactGender,
        thumb: m.thumb,
        v1: '',
      }
      members.push(member)
    })
    const roomPayload: MacproRoomPayload = {
      disturb: roomDetail.disturb,
      members,
      name: roomDetail.name,
      number: roomDetail.number,
      owner: roomDetail.author,
      thumb: roomDetail.thumb,
    }
    return roomPayload
  }

  public async roomRawPayloadParser (
    rawPayload: MacproRoomPayload,
  ): Promise<RoomPayload> {
    log.verbose(PRE, 'roomRawPayloadParser(%s)', rawPayload)

    const payload: RoomPayload = {
      avatar: rawPayload.thumb,
      id : rawPayload.number,
      memberIdList : rawPayload.members.map(m => m.account) || [],
      ownerId: rawPayload.owner,
      topic: rawPayload.name,
    }

    return payload
  }

  public async roomList (): Promise<string[]> {
    log.verbose(PRE, 'roomList()')
    let _roomList: string[] = []

    if (!this.cacheManager) {
      throw CacheManageError(`roomList()`)
    }
    const roomIdList = await this.cacheManager.getRoomIds()
    log.verbose(PRE, `roomList() length = ${roomIdList.length}`)
    await Promise.all(roomIdList.map(async roomId => {
      if (!this.cacheManager) {
        throw CacheManageError(`roomList()`)
      }

      const roomMembers = await this.cacheManager.getRoomMember(roomId)

      if (roomMembers && Object.keys(roomMembers).length > 0) {
        _roomList.push(roomId)
      } else {
        await this.roomRawPayload(roomId)
      }

    }))
    return _roomList
  }

  public async roomMemberList (roomId: string) : Promise<string[]> {
    log.verbose(PRE, 'roommemberList(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberList()')
    }

    let roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)

    if (roomMemberListPayload === undefined) {
      if (!this.id) {
        throw NoIDError(`roomRawPayload()`)
      }
      roomMemberListPayload = {}
      const roomDetail = await this.room.roomDetailInfo(this.id, roomId)
      if (roomDetail) {
        const temp: MacproRoomPayload = await this.convertRoomInfoFromGrpc(roomDetail)
        temp.members.map(member => {
          roomMemberListPayload![member.accountAlias] = member
        })
        await this.cacheManager.setRoomMember(roomId, roomMemberListPayload)
      } else {
        throw new Error(`no payload`)
      }
    }
    return Object.keys(roomMemberListPayload)
  }

  public async roomMemberRawPayload (roomId: string, contactId: string): Promise<MacproRoomMemberPayload>  {
    log.verbose(PRE, 'roomMemberRawPayload(%s, %s)', roomId, contactId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberRawPayload()')
    }
    let roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)
    if (roomMemberListPayload === undefined) {
      if (!this.id) {
        throw NoIDError(`roomRawPayload()`)
      }
      roomMemberListPayload = {}
      const roomDetail = await this.room.roomDetailInfo(this.id, roomId)
      if (roomDetail) {
        const temp: MacproRoomPayload = await this.convertRoomInfoFromGrpc(roomDetail)
        temp.members.map(member => {
          roomMemberListPayload![member.accountAlias] = member
        })
        await this.cacheManager.setRoomMember(roomId, roomMemberListPayload)
      } else {
        throw new Error(`no payload`)
      }
    }
    return roomMemberListPayload[contactId]
  }

  public async roomMemberRawPayloadParser (rawPayload: GrpcRoomMemberPayload): Promise<RoomMemberPayload>  {
    log.verbose(PRE, 'roomMemberRawPayloadParser(%s)', rawPayload)

    const payload: RoomMemberPayload = {
      avatar: rawPayload.bigHeadImgUrl,
      id: rawPayload.userName,
      // inviterId: ??
      name: rawPayload.nickName,
      roomAlias: rawPayload.displayName,
    }

    return payload
  }

  public async roomPayloadDirty (roomId: string) {
    log.silly(`some one want to delete ROOM cache :${roomId}`)
  }

  public async roomMemberPayloadDirty (roomId: string) {
    log.silly(`some one want to delete ROOM MEMBER cache :${roomId}`)
  }

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.verbose(PRE, 'roomAvatar(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError(`roomAvatar()`)
    }

    const payload = await this.cacheManager.getRoom(roomId)

    if (payload && payload.thumb) {
      return FileBox.fromUrl(payload.thumb)
    }
    log.warn(PRE, 'roomAvatar() avatar not found, use the chatie default.')
    return qrCodeForChatie()
  }

  public async roomTopic (roomId: string)                : Promise<string>
  public async roomTopic (roomId: string, topic: string) : Promise<void>

  public async roomTopic (
    roomId: string,
    topic?: string,
  ): Promise<void | string> {
    log.verbose(PRE, 'roomTopic(%s, %s)', roomId, topic)

    if (!this.id) {
      throw NoIDError('roomTopic()')
    }
    if (topic) {
      await this.room.modifyRoomTopic(this.id, roomId, topic)

      if (!this.cacheManager) {
        throw CacheManageError('roomTopic()')
      }
      const room = await this.cacheManager.getRoom(roomId)
      if (!room) {
        throw new Error(`can not get room from cache by room id: ${roomId}.`)
      }
      room.name = topic
      await this.cacheManager.setRoom(roomId, room)
    } else {
      if (!this.cacheManager) {
        throw CacheManageError('roomTopic()')
      }

      const roomPayload = await this.cacheManager.getRoom(roomId)
      if (!roomPayload) {
        throw new Error(`can not get room from cache by room id: ${roomId}.`)
      }
      return roomPayload.name
    }

  }

  public async roomCreate (
    contactIdList: string[],
    topic?: string,
  ): Promise<string> {
    log.verbose(PRE, 'roomCreate(%s, %s)', contactIdList, topic)

    if (!this.id) {
      throw NoIDError('roomCreate()')
    }
    await this.room.createRoom(this.id, contactIdList, topic)

    return new Promise<string>((resolve) => {
      this.grpcGateway.on('room-create', async data => {
        log.silly(PRE, `room-create : ${util.inspect(JSON.parse(data))}`)

        const roomCreate: MacproCreateRoom = JSON.parse(data)

        const roomPayload = await this.convertCreateRoom(roomCreate, contactIdList.toString())

        if (!this.cacheManager) {
          throw CacheManageError('roomCreate()')
        }

        if (roomCreate && roomCreate.account) {
          await this.cacheManager.setRoom(roomCreate.account, roomPayload)
        }
        const roomId = roomCreate.account

        resolve(roomId)
      })
    })

  }

  private async convertCreateRoom (room: MacproCreateRoom, contactIdList: string): Promise<MacproRoomPayload> {
    log.silly(PRE, `contactIdList : ${util.inspect(contactIdList)}`)
    const contactList = contactIdList.split(',')
    const members: MacproContactPayload[] = []

    contactList.map(async contactId => {
      if (!this.cacheManager) {
        throw CacheManageError('convertCreateRoom()')
      }
      const wxid = await this.cacheManager.getAccountWXID(contactId)
      log.silly(PRE, `wxid : ${util.inspect(wxid)}`)
      log.silly(PRE, `contactId : ${util.inspect(contactId)}`)
      let contact: MacproContactPayload | undefined
      if (!wxid) {
        contact = await this.cacheManager.getContact(contactId)
      } else {
        contact = await this.cacheManager.getContact(wxid)
      }
      log.silly(PRE, `contact : ${util.inspect(contact)}`)
      if (contact) {
        members.push(contact)
      } else {
        throw new Error(`can not get contact payload`)
      }
    })

    const roomPayload: MacproRoomPayload = {
      disturb: 1,
      members,
      name: room.name,
      number: room.account,
      owner: room.my_account,
      thumb: room.headerImage,
    }
    return roomPayload
  }

  public async roomAdd (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomAdd(%s, %s)', roomId, contactId)

    if (!this.id) {
      throw NoIDError('roomAdd()')
    }
    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not get accountId for ADD MEMBER to ROOM : ${contactId}`)
    }
    const res = await this.room.roomAdd(this.id, roomId, accountId)

    if (res === RequestStatus.Fail) {
      await this.room.roomInvite(this.id, roomId, accountId)
    }

  }

  private async getAccountId (id: string): Promise<string> {
    if (!this.cacheManager) {
      throw CacheManageError('getAccountId()')
    }
    const contact = await this.cacheManager.getContact(id)
    if (contact && contact.account !== contact.accountAlias) {
      return contact.account
    } else if (contact && contact.account) {
      return contact.accountAlias
    } else {
      return ''
    }
  }

  public async roomDel (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomDel(%s, %s)', roomId, contactId)

    if (!this.id) {
      throw NoIDError('roomDel()')
    }
    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not get accountId for DELETE MEMBER to ROOM : ${contactId}`)
    }
    await this.room.roomDel(this.id, roomId, accountId)
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.verbose(PRE, 'roomQuit(%s)', roomId)

    if (!this.id) {
      throw NoIDError('roomQuit()')
    }
    await this.room.roomQuit(this.id, roomId)
  }

  public async roomQrcode (roomId: string): Promise<string> {
    log.verbose(PRE, 'roomQrcode(%s)', roomId)

    if (!this.id) {
      throw NoIDError('roomQrcode()')
    }
    await this.room.roomQrcode(this.id, roomId)

    // TODO: 需要将监听函数存入数组
    const qrcode = await new Promise<string>((resolve) => {
      this.grpcGateway.on('room-qrcode', (data: string) => {
        const _data: GrpcRoomQrcode = JSON.parse(data)
        log.silly(PRE, `room-qrcode : ${util.inspect(_data)}`)
        resolve(_data.qrcode)
      })
    })
    return qrcode
  }

  public async roomAnnounce (roomId: string)                : Promise<string>
  public async roomAnnounce (roomId: string, text: string)  : Promise<void>

  public async roomAnnounce (roomId: string, text?: string) : Promise<void | string> {
    log.silly(PRE, `room id: ${roomId}, text: ${text}`)
    throw new Error(`not support`)
  }

  /**
   *
   * Room Invitation
   *
   */
  public async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.verbose(PRE, 'roomInvitationAccept(%s)', roomInvitationId)
    throw new Error(`not support`)
  }

  public async roomInvitationRawPayload (roomInvitationId: string): Promise<MacproRoomInvitationPayload> {
    log.verbose(PRE, `roomInvitationRawPayload(${roomInvitationId})`)

    if (!this.cacheManager) {
      throw new Error('no cache')
    }

    const payload = await this.cacheManager.getRoomInvitation(roomInvitationId)

    if (payload) {
      return payload
    } else {
      throw new Error(`can not get invitation with invitation id: ${roomInvitationId}`)
    }
  }

  public async roomInvitationRawPayloadParser (rawPayload: MacproRoomInvitationPayload): Promise<RoomInvitationPayload> {
    log.verbose(PRE, `roomInvitationRawPayloadDirty(${rawPayload})`)
    return {
      id: rawPayload.id,
      inviterId: rawPayload.fromUser,
      roomMemberCount: 0,
      roomMemberIdList: [],
      roomTopic: rawPayload.roomName,
      timestamp: rawPayload.timestamp,
    }
  }

  /**
   *
   * Friendship
   *
   */
  public async friendshipRawPayload (friendshipId: string): Promise<FriendshipPayload> {
    if (!this.cacheManager) {
      throw new Error(`cache manager is not available, can not get friendship raw payload.`)
    }
    const rawPayload = await this.cacheManager.getFriendshipRawPayload(friendshipId)
    if (!rawPayload) {
      throw new Error(`no rawPayload for id ${friendshipId}`)
    }
    return rawPayload
  }

  public async friendshipRawPayloadParser (
    rawPayload: FriendshipPayload
  ) : Promise<FriendshipPayload> {
    return rawPayload
  }

  public async friendshipAdd (
    contactId : string,
    hello     : string,
  ): Promise<void> {
    log.verbose(PRE, 'friendshipAdd(%s, %s)', contactId, hello)

    await this._friendshipAdd(contactId, hello)
  }

  private async _friendshipAdd (
    contactId: string,
    hello: string,
  ) {
    if (!this.id) {
      throw NoIDError('friendshipAdd()')
    }
    if (!this.cacheManager) {
      throw CacheManageError('friendshipAdd()')
    }
    const contact = await this.cacheManager.getContact(contactId)
    const extend = this.id + contactId

    if (contact) {
      await this.user.addFriend(this.id, contact.accountAlias, hello)
    } else {
      await this.user.addFriend(this.id, contactId, hello)
    }
    const result = await new Promise<AddFriendBeforeAccept>(async (resolve) => {
      this.addFriendCB[extend] = (data: AddFriendBeforeAccept) => {
        log.silly(PRE, `get data in AddFriend : ${JSON.stringify(data)}`)
        resolve(data)
      }
    })
    return result
  }

  public async friendshipAccept (
    friendshipId : string,
  ): Promise<void> {
    log.verbose(PRE, 'friendshipAccept(%s)', friendshipId)

    if (!this.cacheManager) {
      throw CacheManageError('friendshipAccept()')
    }
    const friendshipPayload = await this.cacheManager.getFriendshipRawPayload(friendshipId)
    if (!friendshipPayload) {
      log.warn(`Can not find friendship payload, not able to accept friendship.`)
      return
    }
    if (!this.id) {
      throw NoIDError('friendshipAccept()')
    }
    await this.user.acceptFriend(this.id, friendshipPayload.contactId)
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

  public unref (): void {
    log.verbose(PRE, 'unref()')
    super.unref()
    if (this.loopTimer) {
      this.loopTimer.unref()
    }
  }

}

export default PuppetMacpro
