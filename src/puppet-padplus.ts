import util from 'util'
import path from 'path'
import { flatten } from 'array-flatten'

import {
  ContactPayload,
  FileBox,
  FriendshipPayload,
  FriendshipPayloadReceive,
  FriendshipType,
  ImageType,
  MessagePayload,
  MessageType,
  MiniProgramPayload,
  Puppet,
  PuppetOptions,
  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,
  ScanStatus,
  UrlLinkPayload,

  EventDongPayload,
  EventErrorPayload,
  EventFriendshipPayload,
  EventLogoutPayload,
  EventMessagePayload,
  EventResetPayload,
  EventRoomJoinPayload,
  EventRoomLeavePayload,
  EventRoomTopicPayload,
  EventRoomInvitePayload,
  EventScanPayload,
  EventReadyPayload,
  EventHeartbeatPayload,
}                           from 'wechaty-puppet'

import {
  log,
  padplusToken,
  retry,
  GRPC_ENDPOINT,
  PADPLUS_REPLAY_MESSAGE,
}                                   from './config'

import { RequestQueue } from './padplus-manager/api-request/request-queue'
import PadplusManager from './padplus-manager/padplus-manager'
import { PadplusMessageType, PadplusContactPayload, PadplusRoomPayload, GrpcQrCodeLogin, PadplusRoomMemberPayload, PadplusRoomInvitationPayload, FriendshipPayload as PadplusFriendshipPayload, SearchContactTypeStatus, GrpcSearchContact, PadplusMessageStatus, GetContactSelfInfoGrpcResponse, LoginDeviceInfo } from './schemas'
import { PadplusMessagePayload, PadplusRichMediaData, GrpcResponseMessageData } from './schemas/model-message'
import { convertToPuppetRoomMember } from './convert-manager/room-convertor'
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser'
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser'
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser'
import { friendshipConfirmEventMessageParser, friendshipReceiveEventMessageParser, friendshipVerifyEventMessageParser } from './pure-function-helpers/friendship-event-message-parser'
import { messageRawPayloadParser, roomRawPayloadParser, friendshipRawPayloadParser, appMessageParser, isStrangerV2, isStrangerV1, isRoomId, roomInviteEventMessageParser } from './pure-function-helpers'
import { contactRawPayloadParser } from './pure-function-helpers/contact-raw-payload-parser'
import { xmlToJson } from './pure-function-helpers/xml-to-json'
import { convertSearchContactToContact } from './convert-manager/contact-convertor'
import checkNumber from './utils/util'
import { miniProgramMessageParser } from './pure-function-helpers/message-mini-program-payload-parser'
import { convertMiniProgramPayloadToParams, convertMiniProgramPayloadToMessage } from './convert-manager/message-convertor'

const PRE = 'PuppetPadplus'

export class PuppetPadplus extends Puppet {

  private manager: PadplusManager
  private leaveEventKey: string = ''

  constructor (
    public options: PuppetOptions = {},
  ) {
    super(options)

    const token = this.options.token || padplusToken()
    const name = this.options.name
    if (token) {
      this.manager = new PadplusManager({
        endpoint: this.options.endpoint || GRPC_ENDPOINT,
        name,
        token,
      })
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {
    log.info(PRE, `start()`)

    this.state.on('pending')

    await this.startManager(this.manager)

    this.state.on(true)
  }

  private async startManager (manager: PadplusManager) {
    manager.on('scan', async (url: string, status: ScanStatus) => {
      const eventScanPayload: EventScanPayload = {
        qrcode: url,
        status,
      }
      this.emit('scan', eventScanPayload)
    })

    manager.on('login', async (loginData: GrpcQrCodeLogin) => {
      await super.login(loginData.userName)
      await this.manager.syncContacts()
    })

    manager.setMemory(this.memory)

    manager.on('message', msg => this.onMessage(msg))

    manager.on('ready', () => this.emit('ready', { data: 'ready' } as EventReadyPayload))

    manager.on('reset', (reason: string) => {
      const eventResetPayload: EventResetPayload = {
        data: reason,
      }
      this.emit('reset', eventResetPayload)
    })

    manager.on('heartbeat', (data: string) => {
      const eventWatchdogPayload: EventHeartbeatPayload = {
        data,
      }
      this.emit('heartbeat', eventWatchdogPayload)
    })

    manager.on('logout', (reason?: string) => this.logout(true, reason))

    manager.on('room-leave', (data: EventRoomLeavePayload) => {
      this.deduplicateRoomLeaveEvent(data)
    })

    manager.on('error', (err: Error) => {
      const eventErrorPayload: EventErrorPayload = {
        data: err.toString(),
      }
      this.emit('error', eventErrorPayload)
    })
    await manager.start()
  }

  public async stop (): Promise<void> {
    log.info(PRE, 'stop()')

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    if (this.state.off()) {
      log.silly(PRE, 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')
    await this.logout(true, 'logout in wechaty')
    await this.manager.stop()
    this.manager.removeAllListeners()

    this.state.off(true)
    log.silly(PRE, `stop() finished`)
  }

  /**
   * Three type for logout case:
   *   - case 1: logout by WeChat App, need reset
   *   - case 2: logout by call API, need reset
   *   - case 3: logout by call reset, no need reset
   * @param force case 1: true, case 2: false, case 3: true
   * @param reason
   */
  public async logout (force?: boolean, reason?: string): Promise<void> {
    log.info(PRE, `logout(${force}, ${reason})`)

    if (!this.id) {
      log.silly(PRE, 'logout() this.id not exist')
      return
    }

    if (!force) {
      await this.manager.logout(this.selfId())
      reason = 'logout by call logout() method'
    }
    const eventLogoutPayload: EventLogoutPayload = {
      contactId: this.selfId(),
      data: reason ? reason! : 'unknow reason',
    }
    this.emit('logout', eventLogoutPayload)
    this.id = undefined

    if (reason !== 'logout in wechaty') {
      const eventResetPayload: EventResetPayload = {
        data: 'padplus reset',
      }
      this.emit('reset', eventResetPayload)
    }
  }

  async onMessage (message: PadplusMessagePayload) {
    const messageType = message.msgType

    if (isRoomId(message.fromUserName)) {
      await this.roomRawPayload(message.fromUserName)
    } else {
      await this.contactRawPayload(message.fromUserName)
    }
    const eventMessagePayload: EventMessagePayload = {
      messageId: message.msgId,
    }
    switch (messageType) {
      case PadplusMessageType.Sys:
        await Promise.all([
          this.onRoomJoinEvent(message),
          this.onRoomLeaveEvent(message),
          this.onRoomTopicEvent(message),
          this.onFriendshipEvent(message),
        ])
        break
      case PadplusMessageType.VerifyMsg:
        await this.onFriendshipEvent(message)
        break
      case PadplusMessageType.Recalled:
        this.emit('message', eventMessagePayload)
        await this.onRoomJoinEvent(message)
        break
      case PadplusMessageType.Text:
        await this.onFriendshipEvent(message)
        this.emit('message', eventMessagePayload)
        break
      case PadplusMessageType.App:
        await this.onRoomInvitation(message)
        break
      case PadplusMessageType.Contact:
      case PadplusMessageType.Image:
      case PadplusMessageType.Deleted:
      case PadplusMessageType.Voice:
      case PadplusMessageType.SelfAvatar:
      case PadplusMessageType.PossibleFriendMsg:
      case PadplusMessageType.ShareCard:
      case PadplusMessageType.Video:
      case PadplusMessageType.Emoticon:
      case PadplusMessageType.Location:
      case PadplusMessageType.VoipMsg:
      case PadplusMessageType.StatusNotify:
      case PadplusMessageType.VoipNotify:
      case PadplusMessageType.VoipInvite:
      case PadplusMessageType.MicroVideo:
      case PadplusMessageType.SelfInfo:
      case PadplusMessageType.SysNotice:
      case PadplusMessageType.N11_2048:
      case PadplusMessageType.N15_32768:
      default:
        this.emit('message', eventMessagePayload)
        break
    }
  }

  /**
   * ========================
   *     TAG SECTION
   * ========================
   */
  public async tagContactAdd (name: string, contactId: string) : Promise<void> {
    log.silly(PRE, `tagContactAdd(${name}, ${contactId})`)

    const tagId = await this.manager.getOrCreateTag(name)
    return this.manager.addTag(tagId, contactId)
  }

  public async tagContactRemove (name: string, contactId: string) : Promise<void> {
    log.silly(PRE, `tagContactRemove(${name}, ${contactId})`)

    const tagId = await this.manager.getOrCreateTag(name)
    await this.manager.removeTag(tagId, contactId)
  }

  public async tagContactDelete (name: string) : Promise<void> {
    log.silly(PRE, `tagContactDelete(${name})`)

    const tagId = await this.manager.getOrCreateTag(name)
    await this.manager.deleteTag(tagId)
  }

  public async tagContactList (contactId?: string) : Promise<string[]> {
    log.silly(PRE, `tagContactList()`)

    const tags = await this.manager.tags(contactId)
    return tags.map(tag => tag.name)
  }

  /**
   * ========================
   *     CONTACT SECTION
   * ========================
   */
  public async contactSelfQRCode (): Promise<string> {
    log.silly(PRE, `contactSelfQrcode()`)
    return this.manager.contactSelfQrcode()
  }

  public async contactSelfName (name: string): Promise<void> {
    log.silly(PRE, `contactSelfName(${name})`)
    await this.manager.contactSelfName(name)
  }

  public async contactSelfSignature (signature: string): Promise<void> {
    log.silly(PRE, `contactSelfSignature(${signature})`)
    await this.manager.contactSelfSignature(signature)
  }

  public async contactSelfInfo (): Promise<GetContactSelfInfoGrpcResponse> {
    log.silly(PRE, `contactSelfInfo()`)
    return this.manager.contactSelfInfo()
  }

  contactAlias (contactId: string): Promise<string>
  contactAlias (contactId: string, alias: string | null): Promise<void>
  public async contactAlias (contactId: string, alias?: string | null): Promise<string | void>  {
    log.silly(PRE, `contactAlias(), contactId: ${contactId}, alias : ${alias}`)
    if (typeof alias === 'undefined') {
      const payload = await this.contactPayload(contactId)
      return payload.alias || ''
    }

    if (!this.manager) {
      throw new Error(`no padplus manage.`)
    }
    await this.manager.setContactAlias(contactId, alias || '')
  }

  contactAvatar (contactId: string): Promise<FileBox>
  contactAvatar (contactId: string, file: FileBox): Promise<void>
  public async contactAvatar (contactId: string, file?: FileBox): Promise<FileBox | void> {
    if (file) {
      if (contactId !== this.selfId()) {
        throw new Error(`can not set avatar for others.`)
      }
      if (!this.manager) {
        throw new Error(`no padplus manager.`)
      }
      return
    }
    const payload = await this.contactRawPayload(contactId)
    if (!payload || !payload.bigHeadUrl) {
      throw new Error(`can not find contact.`)
    }
    const fileBox = FileBox.fromUrl(
      payload.bigHeadUrl,
      `wechaty-contact-avatar-${payload.userName}.jpg`
    )
    return fileBox
  }

  public async contactList (): Promise<string[]> {
    log.silly(PRE, `contactList()`)
    if (!this.manager) {
      throw new Error(`no padplus manager.`)
    }
    const selfId = this.selfId()
    const contactIds = await this.manager.getContactIdList(selfId)
    return contactIds
  }

  protected async contactRawPayload (contactId: string): Promise<PadplusContactPayload> {

    if (!this.manager) {
      throw new Error(`no manager.`)
    }

    const payload = await this.manager.getContactPayload(contactId)
    return payload
  }

  protected async contactRawPayloadParser (rawPayload: PadplusContactPayload): Promise<ContactPayload> {
    log.silly(PRE, `contactRawPayloadParser()`)

    const payload = contactRawPayloadParser(rawPayload)
    return payload
  }

  /**
   * =========================
   *    FRIENDSHIP SECTION
   * =========================
   */
  async onFriendshipEvent (message: PadplusMessagePayload): Promise<void> {
    log.silly(PRE, 'onPadplusMessageFriendshipEvent({id=%s})', message.msgId)
    /**
     * 1. Look for friendship confirm event
     */
    const friendshipConfirmContactId = friendshipConfirmEventMessageParser(message)
    /**
     * 2. Look for friendship receive event
     */
    const friendshipReceiveContactId = await friendshipReceiveEventMessageParser(message)
    /**
     * 3. Look for friendship verify event
     */
    const friendshipVerifyContactId = friendshipVerifyEventMessageParser(message)

    if (friendshipConfirmContactId
        || friendshipReceiveContactId
        || friendshipVerifyContactId
    ) {
      // Maybe load contact here since we know a new friend is added
      if (!this.manager) {
        throw new Error(`no manager.`)
      }
      const friendship = await friendshipRawPayloadParser(message)
      if (!friendship) {
        log.silly(PRE, `not friendship : ${message.msgId}`)
        return
      }
      const { msgId } = message
      await this.manager.saveFriendship(msgId, friendship)
      const eventFriendshipPayload: EventFriendshipPayload = {
        friendshipId: msgId,
      }
      this.emit('friendship', eventFriendshipPayload)
    }
  }

  public async friendshipSearchPhone (phone: string): Promise<string | null> {
    log.silly(PRE, `friendshipSearchPhone(${phone})`)

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    const isPhoneNumber = checkNumber(phone)
    if (!isPhoneNumber) {
      log.error(PRE, `Some wrong with your phone number, please check it again.`)
      return null
    } else {
      const searchContact: GrpcSearchContact = await this.manager.searchContact(phone, true)
      if (!isStrangerV1(searchContact.v1) && !isStrangerV2(searchContact.v2)) {
        return searchContact.v1
      }

      if (!this.manager || !this.manager.cacheManager) {
        throw new Error(`no cache manager`)
      }

      const contactPayload = convertSearchContactToContact(searchContact, isPhoneNumber)
      await this.manager.cacheManager.setContact(phone, contactPayload)
      return phone
    }
  }

  public async friendshipSearchWeixin (weixin: string): Promise<string | null> {
    log.silly(PRE, `friendshipSearchWeixin(${weixin})`)

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    const searchContact: GrpcSearchContact = await this.manager.searchContact(weixin, true)
    if (!isStrangerV1(searchContact.v1) && !isStrangerV2(searchContact.v2)) {
      return searchContact.v1
    }

    if (!this.manager || !this.manager.cacheManager) {
      throw new Error(`no cache manager`)
    }

    const contactPayload = convertSearchContactToContact(searchContact)
    await this.manager.cacheManager.setContact(weixin, contactPayload)
    return weixin
  }

  public async friendshipAdd (contactId: string, hello?: string): Promise<void> {
    log.silly(PRE, `friendshipAdd(${contactId}, ${hello})`)

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    const searchContact: GrpcSearchContact | null = await this.manager.searchContact(contactId)
    if (searchContact === null) {
      throw new Error(`Can not search friend by contact id : ${contactId}`)
    }
    /**
     * If the contact is not stranger, than using WXSearchContact can get userName
     */
    if (searchContact.wxid !== '' && !isStrangerV1(searchContact.v1) && !isStrangerV2(searchContact.v2)) {
      log.silly(PRE, `friendshipAdd ${contactId} has been friend with bot, no need to send friend request!`)
      return
    }

    let strangerV1
    let strangerV2
    if (isStrangerV1(searchContact.v1)) {
      strangerV1 = searchContact.v1
      strangerV2 = searchContact.v2
    } else if (isStrangerV2(searchContact.v2)) {
      strangerV1 = searchContact.v1
      strangerV2 = searchContact.v2
    } else {
      throw new Error('stranger neither v1 nor v2!')
    }

    const isPhoneNumber = contactId.match(/^[1]([3-9])[0-9]{9}$/)
    const res = await this.manager.addFriend(
      contactId,
      hello,
      isPhoneNumber ? SearchContactTypeStatus.MOBILE : SearchContactTypeStatus.WXID, // default to wxid
      strangerV1 || '',
      strangerV2 || '',
    )

    if (res && res.status !== '0') {
      throw new Error(`add friend failed.`)
    } else if (res && res.status === '0') {
      log.silly(PRE, `add friend request success.`)
    }
  }

  public async friendshipAccept (friendshipId: string): Promise<void> {
    log.silly(PRE, `friendshipAccept(${friendshipId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const payload = await this.manager.getFriendship(friendshipId) as undefined | FriendshipPayloadReceive
    if (!payload || payload.type !== FriendshipType.Receive) {
      throw new Error(`can not find friendship payload ${JSON.stringify(payload)} or friendship type ${payload && payload.type} error.`)
    }
    const { contactId, scene, stranger, ticket } = payload as FriendshipPayloadReceive
    if (!stranger || !ticket) {
      throw new Error(`friendship data error, stranger or ticket is null.`)
    }
    await this.manager.confirmFriendship(contactId, stranger, ticket, (scene && scene.toString()) || '3')
  }

  protected async friendshipRawPayload (friendshipId: string): Promise<PadplusFriendshipPayload> {
    log.silly(PRE, `friendshipRawPayload(${friendshipId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const payload = await this.manager.getFriendship(friendshipId)
    if (payload) {
      return payload
    }
    throw new Error(`can not find friendship.`)
  }

  protected async friendshipRawPayloadParser (rawPayload: PadplusFriendshipPayload): Promise<FriendshipPayload> {
    log.silly(PRE, `friendshipRawPayloadParser(${util.inspect(rawPayload)})`)

    return rawPayload as FriendshipPayload
  }

  // get
  public async friendshipPayload (friendshipId: string): Promise<FriendshipPayload>
  // set
  public async friendshipPayload (friendshipId: string, friendshipPayload: FriendshipPayload): Promise<void>

  public async friendshipPayload (
    friendshipId: string,
    friendshipPayload?: FriendshipPayload,
  ): Promise<void | FriendshipPayload> {
    log.silly('PadPlus', 'friendshipPayload(%s)',
      friendshipId,
      friendshipPayload
        ? ',' + JSON.stringify(friendshipPayload)
        : '',
    )

    if (typeof friendshipPayload === 'object') {
      const payloadCache = await this.manager.getFriendship(friendshipId)
      if (!payloadCache) {
        await this.manager.saveFriendship(friendshipId, friendshipPayload)
      }
      return
    }

    const rawPayload = await this.friendshipRawPayload(friendshipId)
    const payload = await this.friendshipRawPayloadParser(rawPayload)
    return payload
  }

  /**
   * =========================
   *   MESSAGE IMAGE SECTION
   * =========================
   */
  public async messageImage (messageId: string, type: ImageType): Promise<FileBox> {
    log.silly(PRE, `messageImage(${messageId})`)
    const rawPayload = await this.messageRawPayload(messageId)

    if (!rawPayload || !rawPayload.url) {
      throw new Error(`can not find message raw payload by id : ${messageId}`)
    }

    switch (type) {
      case ImageType.Thumbnail:
        return FileBox.fromUrl(rawPayload.url)
      case ImageType.HD:
        throw new Error(`HD not support!`)
      case ImageType.Artwork:
        let content = rawPayload.content
        const mediaData: PadplusRichMediaData = {
          appMsgType: 0,
          content,
          contentType: 'img',
          createTime: rawPayload.createTime,
          fileName: rawPayload.fileName || '',
          fromUserName: rawPayload.fromUserName,
          msgId: rawPayload.msgId,
          msgType: rawPayload.msgType,
          src: rawPayload.url,
          toUserName: rawPayload.toUserName,
        }
        const data = await RequestQueue.exec(() => this.manager.loadRichMediaData(mediaData))

        if (data && data.src) {
          const name = this.getNameFromUrl(data.src)
          let src: string
          if (escape(data.src).indexOf('%u') === -1) {
            src = data.src
          } else {
            src = encodeURI(data.src)
          }
          return FileBox.fromUrl(src, name)
        } else {
          throw new Error(`Can not get media data url by this message id: ${messageId}`)
        }
      default:
        throw new Error(`this type : ${type} is wrong.`)
    }
  }

  /**
   * ========================
   *     MESSAGE SECTION
   * ========================
   */
  public async messageFile (messageId: string): Promise<FileBox> {
    log.silly(PRE, `messageFile(${messageId})`)

    const rawPayload = await this.messageRawPayload(messageId)
    const payload    = await this.messagePayload(messageId)

    let filename = payload.filename || payload.id
    const type = payload.type === MessageType.Image ? 'img' : payload.type === MessageType.Video ? 'video' : 'file'
    switch (payload.type) {
      case MessageType.Image:
      case MessageType.Attachment:
      case MessageType.Video:
        let content = rawPayload.content
        const mediaData: PadplusRichMediaData = {
          appMsgType: type === 'file' ? 6 : 0,
          content,
          contentType: type,
          createTime: rawPayload.createTime,
          fileName: rawPayload.fileName || '',
          fromUserName: rawPayload.fromUserName,
          msgId: rawPayload.msgId,
          msgType: rawPayload.msgType,
          src: rawPayload.url,
          toUserName: rawPayload.toUserName,
        }
        const data = await RequestQueue.exec(() => this.manager.loadRichMediaData(mediaData))

        if (data && data.src) {
          const name = this.getNameFromUrl(data.src)
          let src: string
          if (escape(data.src).indexOf('%u') === -1) {
            src = data.src
          } else {
            src = encodeURI(data.src)
          }
          return FileBox.fromUrl(src, name)
        } else {
          throw new Error(`Can not get media data url by this message id: ${messageId}`)
        }
      case MessageType.Emoticon:
        if (rawPayload && rawPayload.url) {
          const name = this.getNameFromUrl(rawPayload.url)
          return FileBox.fromUrl(rawPayload.url, name)
        } else {
          throw new Error(`can not get image/audio url fot message id: ${messageId}`)
        }
      case MessageType.Audio:
        if (rawPayload && rawPayload.url) {
          const name = this.getNameFromUrl(rawPayload.url)
          const fileBox = FileBox.fromUrl(rawPayload.url, name)
          let contentXML
          if (isRoomId(rawPayload.fromUserName)) {
            contentXML = rawPayload.content.split(':\n')[1]
          } else {
            contentXML = rawPayload.content
          }
          const content = await xmlToJson(contentXML)
          fileBox.metadata = {
            voiceLength: content.msg.voicemsg.$.voicelength / 1000,
          }
          return fileBox
        } else {
          throw new Error(`can not get image/audio url fot message id: ${messageId}`)
        }
      default:
        const base64 = 'Tm90IFN1cHBvcnRlZCBBdHRhY2htZW50IEZpbGUgVHlwZSBpbiBNZXNzYWdlLgpTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9DaGF0aWUvd2VjaGF0eS9pc3N1ZXMvMTI0OQo='
        filename = 'wechaty-puppet-padplus-message-attachment-' + messageId + '.txt'
        return FileBox.fromBase64(
          base64,
          filename,
        )
    }
  }

  private getNameFromUrl (url: string): string {
    const _name = path.parse(url).base
    let name: string = ''
    if (_name.indexOf('?')) {
      name = decodeURIComponent(_name.split('?')[0])
    } else {
      name = `unknow-${Date.now()}`
    }
    return name
  }

  public async messageUrl (messageId: string): Promise<UrlLinkPayload> {
    log.silly(PRE, `messageUrl(${messageId})`)

    const rawPayload = await this.messageRawPayload(messageId)
    const payload = await this.messagePayload(messageId)

    if (payload.type !== MessageType.Url) {
      throw new Error('Can not get url from non url payload')
    } else {
      const appPayload = await appMessageParser(rawPayload)
      if (appPayload) {
        return {
          description: appPayload.des,
          thumbnailUrl: appPayload.thumburl,
          title: appPayload.title,
          url: appPayload.url,
        }
      } else {
        throw new Error('Can not parse url message payload')
      }
    }
  }

  public async messageContact (messageId: string): Promise<string> {
    throw new Error(`not implement`)
  }

  public async messageMiniProgram (messageId: string): Promise<MiniProgramPayload> {
    log.silly(PRE, `messageMiniProgram(${messageId})`)

    const messageRawPayload = await this.messageRawPayload(messageId)

    const miniProgramPayload = await miniProgramMessageParser(messageRawPayload)
    if (!miniProgramPayload) {
      throw new Error(`Can not abstract mini program data from the wrong xml structure.`)
    }
    return miniProgramPayload
  }

  public async messageForward (conversationId: string, messageId: string): Promise<void> {
    log.silly(PRE, `messageForward(${conversationId}, ${messageId})`)

    const payload = await this.messagePayload(messageId)

    if (payload.type === MessageType.Text) {
      if (!payload.text) {
        throw new Error('no text')
      }
      await this.messageSendText(
        conversationId,
        payload.text,
      )
    } else if (payload.type === MessageType.Audio) {
      const rawPayload = await this.messageRawPayload(payload.id)
      let contentXML
      let url
      if (isRoomId(rawPayload.fromUserName)) {
        contentXML = rawPayload.content.split(':\n')[1]
        url = rawPayload.url!
      } else {
        contentXML = rawPayload.content
        url = rawPayload.fileName!
      }
      const content = await xmlToJson(contentXML)
      const voiceLength = content.msg.voicemsg.$.voicelength
      await this.messageSendVoice(conversationId, url, voiceLength)
    } else if (payload.type === MessageType.Url) {
      await this.messageSendUrl(
        conversationId,
        await this.messageUrl(messageId)
      )
    } else if (payload.type === MessageType.MiniProgram) {
      await this.messageSendMiniProgram(
        conversationId,
        await this.messageMiniProgram(messageId)
      )
    } else if (payload.type === MessageType.ChatHistory) {
      throw new Error('Message type ChatHistory not supported.')
    } else {
      await this.messageSendFile(
        conversationId,
        await this.messageFile(messageId),
      )
    }
  }

  private generateBaseMsg (msgId: string, to: string): PadplusMessagePayload {
    const msg: PadplusMessagePayload = {
      content: '',
      createTime: new Date().getTime(),
      fromUserName: this.selfId(),
      imgStatus: 0,
      l1MsgType: 0,
      msgId,
      msgSource: '',
      msgSourceCd: 0,
      msgType: PadplusMessageType.Text,
      newMsgId: Number(msgId),
      pushContent: '',
      status: PadplusMessageStatus.One,
      toUserName: to,
      uin: '',
      wechatUserName: this.selfId(),
    }
    log.silly(PRE, 'generateBaseMsg(%s) %s', to, JSON.stringify(msg))
    this.manager.cachePadplusMessagePayload.set(msgId, msg)
    return msg
  }

  public async messageSendText (conversationId: string, text: string, mentionIdList?: string[]): Promise<void | string> {
    log.silly(PRE, `messageSendText(${conversationId}, ${text})`)

    let msgData: GrpcResponseMessageData
    if (mentionIdList && mentionIdList.length > 0) {
      msgData = await this.manager.sendMessage(this.selfId(), conversationId, text, PadplusMessageType.Text, mentionIdList.toString())
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, conversationId, text, mentionIdList)
      }
    } else {
      msgData = await this.manager.sendMessage(this.selfId(), conversationId, text, PadplusMessageType.Text)
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, conversationId, text)
      }
    }
    if (msgData.success) {
      const msgPayload: PadplusMessagePayload = {
        content: text,
        createTime: msgData.timestamp,
        fromUserName: this.selfId(),
        imgStatus: 0,
        l1MsgType: 0,
        msgId: msgData.msgId,
        msgSource: this.generateMsgSource(mentionIdList),
        msgSourceCd: 0,
        msgType: PadplusMessageType.Text,
        newMsgId: Number(msgData.msgId),
        pushContent: text,
        status: 1,
        toUserName: conversationId,
        uin: '',
        wechatUserName: '',
      }
      this.manager.cachePadplusMessagePayload.set(msgData.msgId, msgPayload)
    }
    return msgData.msgId
  }

  private replayTextMsg (msgId: string, to: string, text: string, atUserList?: string[]): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.Text
    payload.content = text
    if (atUserList) {
      payload.msgSource = this.generateMsgSource(atUserList)
    }
    log.silly(PRE, 'replayTextMsg replaying message: %s', JSON.stringify(payload))
    const eventMessagePayload: EventMessagePayload = {
      messageId: payload.msgId,
    }
    this.emit('message', eventMessagePayload)
  }

  protected generateMsgSource (mentionIdList?: string[]) {
    if (mentionIdList && mentionIdList.length > 0) {
      return `<msgsource>\n\t<atuserlist>${mentionIdList.join(',')}</atuserlist>\n</msgsource>\n`
    } else {
      return '<msgsource>\n</msgsource>'
    }
  }

  public async messageSendVoice (conversationId: string, url: string, fileSize: string): Promise<void | string> {
    log.silly(PRE, `messageSendVoice(${conversationId}, ${url}, ${fileSize})`)

    const voiceMessageData: GrpcResponseMessageData = await this.manager.sendVoice(this.selfId(), conversationId, url, fileSize)

    if (voiceMessageData.success) {
      const msgPayload: PadplusMessagePayload = {
        content: url,
        createTime: voiceMessageData.timestamp,
        fromUserName: this.selfId(),
        imgStatus: 0,
        l1MsgType: 0,
        msgId: voiceMessageData.msgId,
        msgSource: this.generateMsgSource(),
        msgSourceCd: 0,
        msgType: PadplusMessageType.Text,
        newMsgId: Number(voiceMessageData.msgId),
        pushContent: url,
        status: 1,
        toUserName: conversationId,
        uin: '',
        wechatUserName: '',
      }
      this.manager.cachePadplusMessagePayload.set(voiceMessageData.msgId, msgPayload)
    }
    return voiceMessageData.msgId
  }

  public async messageSendContact (conversationId: string, contactId: string): Promise<void | string> {
    log.silly(PRE, `messageSendContact(${conversationId}, ${contactId})`)

    let contact = await this.manager.getContact(contactId)
    if (contact) {
      const content = {
        headImgUrl: contact.smallHeadUrl,
        nickName: contact.nickName,
        userName: contact.userName,
      }
      const contactData: GrpcResponseMessageData = await this.manager.sendContact(this.selfId(), conversationId, JSON.stringify(content))
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayContactMsg(contactData.msgId, conversationId, JSON.stringify(content))
      }
      if (contactData.success) {
        const msgPayload: PadplusMessagePayload = {
          content: JSON.stringify(content),
          createTime: contactData.timestamp,
          fromUserName: this.selfId(),
          imgStatus: 0,
          l1MsgType: 0,
          msgId: contactData.msgId,
          msgSource: this.generateMsgSource(),
          msgSourceCd: 0,
          msgType: PadplusMessageType.Text,
          newMsgId: Number(contactData.msgId),
          pushContent: JSON.stringify(content),
          status: 1,
          toUserName: conversationId,
          uin: '',
          wechatUserName: '',
        }
        this.manager.cachePadplusMessagePayload.set(contactData.msgId, msgPayload)
      }
      return contactData.msgId
    } else {
      throw new Error('not able to send contact')
    }
  }

  private replayContactMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.ShareCard
    payload.content = content
    log.silly(PRE, 'replayContactMsg replaying message: %s', JSON.stringify(payload))
    const eventMessagePayload: EventMessagePayload = {
      messageId: payload.msgId,
    }
    this.emit('message', eventMessagePayload)
  }

  public async messageSendFile (conversationId: string, file: FileBox): Promise<void | string> {
    log.silly(PRE, `messageSendFile(${conversationId})`)

    let fileUrl = ''
    if ((file as any).remoteUrl) {
      fileUrl = (file as any).remoteUrl
    } else {
      fileUrl = await this.manager.generatorFileUrl(file)
    }
    const fileSize = (await file.toBuffer()).length
    log.silly(PRE, `file url : ${fileUrl}`)

    const type = (file.mimeType && file.mimeType !== 'application/octet-stream')
      ? file.mimeType
      : path.extname(file.name)

    log.silly(PRE, `fileType ${type}`)
    switch (type) {
      case '.slk':
        throw new Error('not support')
      case 'image/jpeg':
      case 'image/png':
      case '.jpg':
      case '.jpeg':
      case '.png':
        const picData = await this.manager.sendFile(this.selfId(), conversationId, fileUrl, file.name, 'pic')
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayImageMsg(picData.msgId, conversationId, fileUrl)
        }
        if (picData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: picData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: picData.msgId,
            msgSource: this.generateMsgSource(),
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(picData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: conversationId,
            uin: '',
            wechatUserName: '',
          }
          this.manager.cachePadplusMessagePayload.set(picData.msgId, msgPayload)
        }
        return picData.msgId
      case 'video/mp4':
      case '.mp4':
        const videoData = await this.manager.sendVideo(this.selfId(), conversationId, fileUrl)
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(videoData.msgId, conversationId, fileUrl)
        }
        if (videoData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: videoData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: videoData.msgId,
            msgSource: this.generateMsgSource(),
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(videoData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: conversationId,
            uin: '',
            wechatUserName: '',
          }
          this.manager.cachePadplusMessagePayload.set(videoData.msgId, msgPayload)
        }
        return videoData.msgId
      case 'application/xml':
        throw new Error(`Can not parse the url data, please input a name for FileBox.fromUrl(url, name).`)
      default:
        const docData = await this.manager.sendFile(this.selfId(), conversationId, fileUrl, file.name, 'doc', fileSize)
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(docData.msgId, conversationId, fileUrl)
        }
        if (docData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: docData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: docData.msgId,
            msgSource: this.generateMsgSource(),
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(docData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: conversationId,
            uin: '',
            wechatUserName: '',
          }
          this.manager.cachePadplusMessagePayload.set(docData.msgId, msgPayload)
        }
        return docData.msgId
    }
  }

  private replayImageMsg (msgId: string, to: string, url: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.Image
    payload.content = `<msg>${url}</msg>`
    payload.url = url
    log.silly(PRE, 'replayImageMsg replaying message: %s', JSON.stringify(payload))
    const eventMessagePayload: EventMessagePayload = {
      messageId: payload.msgId,
    }
    this.emit('message', eventMessagePayload)
  }

  private replayAppMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = `<msg>${content}</msg>`
    log.silly(PRE, 'replayAppMsg replaying message: %s', JSON.stringify(payload))
    const eventMessagePayload: EventMessagePayload = {
      messageId: payload.msgId,
    }
    this.emit('message', eventMessagePayload)
  }

  public async messageSendUrl (conversationId: string, urlLinkPayload: UrlLinkPayload): Promise<void | string> {
    log.silly(PRE, `messageSendUrl(${conversationId})`)

    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload = {
      description,
      thumburl: thumbnailUrl,
      title,
      type: 5,
      url,
    }
    const urlLinkData = await this.manager.sendUrlLink(this.selfId(), conversationId, JSON.stringify(payload))
    if (PADPLUS_REPLAY_MESSAGE) {
      this.replayUrlLinkMsg(urlLinkData.msgId, conversationId, JSON.stringify(payload))
    }
    if (urlLinkData.success) {
      const msgPayload: PadplusMessagePayload = {
        content: JSON.stringify(payload),
        createTime: urlLinkData.timestamp,
        fromUserName: this.selfId(),
        imgStatus: 0,
        l1MsgType: 0,
        msgId: urlLinkData.msgId,
        msgSource: this.generateMsgSource(),
        msgSourceCd: 0,
        msgType: PadplusMessageType.Text,
        newMsgId: Number(urlLinkData.msgId),
        pushContent: JSON.stringify(payload),
        status: 1,
        toUserName: conversationId,
        uin: '',
        wechatUserName: '',
      }
      this.manager.cachePadplusMessagePayload.set(urlLinkData.msgId, msgPayload)
    }

    return urlLinkData.msgId
  }

  private replayUrlLinkMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = content
    log.silly(PRE, 'replayUrlLinkMsg replaying message: %s', JSON.stringify(payload))
    const eventMessagePayload: EventMessagePayload = {
      messageId: payload.msgId,
    }
    this.emit('message', eventMessagePayload)
  }

  public async messageSendMiniProgram (conversationId: string, miniProgramPayload: MiniProgramPayload): Promise<string | void> {
    log.silly(PRE, `messageSendMiniProgram(${conversationId}, ${miniProgramPayload})`)

    if (!this.manager) {
      throw new Error(`no manager`)
    }
    const content = convertMiniProgramPayloadToParams(miniProgramPayload)
    const miniProgramData = await this.manager.sendMiniProgram(this.selfId(), conversationId, JSON.stringify(content))
    if (PADPLUS_REPLAY_MESSAGE) {
      this.replayUrlLinkMsg(miniProgramData.msgId, conversationId, JSON.stringify(content))
    }
    if (miniProgramData.success) {
      const source = this.generateMsgSource()
      const msgPayload = convertMiniProgramPayloadToMessage(this.selfId(), conversationId, source, content, miniProgramData)
      this.manager.cachePadplusMessagePayload.set(miniProgramData.msgId, msgPayload)
    }

    return miniProgramData.msgId
  }

  public async messageRawPayload (messageId: string): Promise<PadplusMessagePayload> {
    log.silly(PRE, `messageRawPayload(${messageId})`)

    if (!this.manager) {
      throw new Error(`no manager`)
    }

    let rawPayload = this.manager.cachePadplusMessagePayload.get(messageId)

    if (rawPayload) {
      return rawPayload
    }

    if (!this.manager.cacheManager) {
      throw new Error(`no cache manager`)
    }
    rawPayload = await this.manager.cacheManager.getMessage(messageId)
    if (!rawPayload) {
      log.error('PuppetPadplus', 'messageRawPayload(%s) manager.cacheManager.getMessage(%s) return nothing.',
        messageId,
        messageId,
      )
      throw new Error('no message rawPayload for message id ' + messageId)
    }
    return rawPayload
  }

  public async messageRawPayloadParser (rawPayload: PadplusMessagePayload): Promise<MessagePayload> {
    log.silly(PRE, 'messageRawPayloadParser()')

    const payload = await messageRawPayloadParser(rawPayload)

    if (payload.mentionIdList && payload.mentionIdList.length === 1 && payload.mentionIdList[0] === 'announcement@all') {
      const memberIds = await this.roomMemberList(payload.roomId!)
      payload.mentionIdList = memberIds.filter(m => m !== payload.fromId)
      payload.text = `${payload.text || ''}`
    }

    return payload
  }

  public async messageRecall (messageId: string): Promise<boolean> {
    log.silly(PRE, `messageRecall(${messageId})`)

    const payload = await this.messagePayload(messageId)
    const receiverId = payload.roomId || payload.toId
    log.silly(PRE, 'messageRecall(%s, %s)', receiverId, messageId)

    const isSuccess = await this.manager.recallMessage(this.selfId(), receiverId!, messageId)
    return isSuccess
  }

  /**
   * ========================
   *      ROOM SECTION
   * ========================
   */
  protected async onRoomJoinEvent (message: PadplusMessagePayload): Promise<void> {
    log.silly(PRE, `onRoomJoinEvent(${message.msgId})`)

    const joinEvent = await roomJoinEventMessageParser(message)

    if (joinEvent) {
      log.silly(PRE, `receive room-join event : ${util.inspect(joinEvent)}`)
      const inviteeNameList = joinEvent.inviteeNameList
      const inviterName     = joinEvent.inviterName
      const roomId          = joinEvent.roomId
      const timestamp       = joinEvent.timestamp

      const inviteeIdList = await retry(async (retryException, attempt) => {
        log.silly(PRE, 'onPadplusMessageRoomEventJoin({id=%s}) roomJoin retry(attempt=%d)', attempt)

        const tryIdList = flatten(
          await Promise.all(
            inviteeNameList.map(
              inviteeName => this.roomMemberSearch(roomId, inviteeName),
            ),
          ),
        )

        if (tryIdList.length) {
          return tryIdList
        }

        if (!this.manager) {
          throw new Error('no manager')
        }

        // Set Cache Dirty
        await this.roomMemberPayloadDirty(roomId)

        return retryException(new Error('roomMemberSearch() not found'))

      }).catch(e => {
        log.silly(PRE, 'onPadplusMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
        return [] as string[]
      })

      let inviterIdList = await this.roomMemberSearch(roomId, inviterName)

      if (inviterIdList.length < 1) {
        await this.roomMemberPayloadDirty(roomId)
        await this.manager.getRoomMembers(roomId)
        inviterIdList = await this.roomMemberSearch(roomId, inviterName)
        if (inviterIdList.length < 1) {
          throw new Error(`can not get room member`)
        }
      } else if (inviterIdList.length > 1) {
        log.silly(PRE, 'onPadplusMessageRoomEventJoin() inviterId found more than 1, use the first one.')
      }

      const inviterId = inviterIdList[0]

      // Set Cache Dirty
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      const eventRoomJoinPayload: EventRoomJoinPayload = {
        inviteeIdList,
        inviterId,
        roomId,
        timestamp,
      }
      this.emit('room-join', eventRoomJoinPayload)
    }
  }

  protected async onRoomLeaveEvent (message: PadplusMessagePayload): Promise<void> {
    log.silly(PRE, `onRoomLeaveEvent(${message.msgId})`)

    const leaveEvent = roomLeaveEventMessageParser(message)

    if (leaveEvent) {
      log.silly(PRE, `receive room-leave event : ${util.inspect(leaveEvent)}`)
      const leaverNameList = leaveEvent.leaverNameList
      const removerName    = leaveEvent.removerName
      const roomId         = leaveEvent.roomId
      const timestamp      = leaveEvent.timestamp

      const leaverIdList = flatten(
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
        log.silly(PRE, 'onPadplusMessageRoomEventLeave(): removerId found more than 1, use the first one.')
      }
      const removerId = removerIdList[0]

      if (!this.manager) {
        throw new Error('no padplusManager')
      }

      const eventRoomLeavePayload: EventRoomLeavePayload = {
        removeeIdList: leaverIdList,
        removerId,
        roomId,
        timestamp,
      }
      this.deduplicateRoomLeaveEvent(eventRoomLeavePayload)
    }
  }

  protected async onRoomTopicEvent (message: PadplusMessagePayload): Promise<void> {
    log.silly(PRE, `onRoomTopicEvent(${message.msgId})`)

    const topicEvent = roomTopicEventMessageParser(message)

    if (topicEvent) {
      log.silly(PRE, `receive room-topic event : ${util.inspect(topicEvent)}`)
      const changerName = topicEvent.changerName
      const newTopic    = topicEvent.topic
      const roomId      = topicEvent.roomId
      const timestamp   = topicEvent.timestamp

      const roomOldPayload = await this.roomPayload(roomId)
      const oldTopic       = roomOldPayload.topic

      const changerIdList = await this.roomMemberSearch(roomId, changerName)
      if (changerIdList.length < 1) {
        throw new Error('no changerId found')
      } else if (changerIdList.length > 1) {
        log.silly(PRE, 'onPadplusMessageRoomEventTopic() changerId found more than 1, use the first one.')
      }
      const changerId = changerIdList[0]

      if (!this.manager) {
        throw new Error('no padplusManager')
      }

      // Set Cache Dirty
      await this.roomPayloadDirty(roomId)
      if (this.manager && this.manager.cacheManager) {
        await this.manager.cacheManager.deleteRoom(roomId)
      }
      const eventRoomTopicPayload: EventRoomTopicPayload = {
        changerId,
        newTopic,
        oldTopic,
        roomId,
        timestamp,
      }
      this.emit('room-topic', eventRoomTopicPayload)
    }
  }

  protected async onRoomInvitation (rawPayload: PadplusMessagePayload): Promise<void> {
    log.silly(PRE, 'onRoomInvitation()')

    const roomInviteEvent = await roomInviteEventMessageParser(rawPayload)

    if (roomInviteEvent) {
      if (!this.manager) {
        throw new Error('no manager')
      }
      await this.manager.saveRoomInvitationRawPayload(roomInviteEvent)
      const eventRoomInvitePayload: EventRoomInvitePayload = {
        roomInvitationId: roomInviteEvent.msgId,
      }
      this.emit('room-invite', eventRoomInvitePayload)
    } else {
      const eventMessagePayload: EventMessagePayload = {
        messageId: rawPayload.msgId,
      }
      this.emit('message', eventMessagePayload)
    }
  }

  public async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.silly(PRE, `roomInvitationAccept(${roomInvitationId})`)

    if (!this.manager) {
      throw new Error('no manager')
    }
    await this.manager.roomInvitationAccept(roomInvitationId)
  }

  public async roomInvitationRawPayload (roomInvitationId: string): Promise<PadplusRoomInvitationPayload> {
    log.silly(PRE, `roomInvitationRawPayload(${roomInvitationId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const payload = await this.manager.roomInvitationRawPayload(roomInvitationId)
    return payload
  }

  public async roomInvitationRawPayloadParser (rawPayload: PadplusRoomInvitationPayload): Promise<RoomInvitationPayload> {
    log.silly(PRE, `roomInvitationRawPayloadParser()`)

    const payload: RoomInvitationPayload = {
      avatar: rawPayload.thumbUrl,
      id: rawPayload.id,
      invitation: rawPayload.url,
      inviterId: rawPayload.fromUser,
      memberCount: 0,
      memberIdList: [],
      receiverId: rawPayload.receiver,
      timestamp: rawPayload.timestamp,
      topic: rawPayload.roomName,
    }
    return payload
  }

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.silly(PRE, `roomAvatar(${roomId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const room = await this.roomRawPayload(roomId)
    if (room) {
      const avatarUrl = room.bigHeadUrl || room.smallHeadUrl
      return FileBox.fromUrl(avatarUrl, `${roomId}_avatar_${Date.now()}.png`)
    } else {
      throw new Error(`Can not load room info by roomId : ${roomId}`)
    }
  }

  public async roomCreate (contactIdList: string[], topic?: string | undefined): Promise<string> {
    log.silly(PRE, `roomCreate(${contactIdList}, ${topic})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const result = await this.manager.createRoom(topic || '', contactIdList)
    return result
  }

  public async roomAdd (roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `roomAdd(${roomId}, ${contactId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    await this.manager.roomAddMember(roomId, contactId)
  }

  public async roomDel (roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `roomDel(${roomId}, ${contactId})`)

    const memberIdList = await this.roomMemberList(roomId)
    if (memberIdList.includes(contactId)) {
      await this.manager.deleteRoomMember(roomId, contactId)
    } else {
      log.silly(PRE, `roomDel() room(${roomId}) has no member contact(${contactId})`)
    }
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.silly(PRE, `roomQuit(${roomId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    await this.manager.quitRoom(roomId)
  }

  public async roomTopic (roomId: string): Promise<string>
  public async roomTopic (roomId: string, topic: string): Promise<void>
  public async roomTopic (roomId: string, topic?: string | undefined): Promise<string | void>
  public async roomTopic (roomId: string, topic?: any): Promise<string | void> {
    log.silly(PRE, `roomTopic(${roomId}, ${topic})`)

    if (typeof topic === 'undefined') {
      const room = await this.roomPayload(roomId)
      return room && (room.topic || '')
    }
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    await this.manager.setRoomTopic(roomId, topic as string)
    await this.roomPayloadDirty(roomId)
    await new Promise(resolve => setTimeout(resolve, 500))
    await this.roomTopic(roomId)
  }

  async roomQRCode (roomId: string): Promise<string> {
    log.silly(PRE, `roomQRCode(${roomId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    return this.manager.getRoomQrcode(roomId)
  }

  async roomList (): Promise<string[]> {
    log.silly(PRE, `roomList()`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    return this.manager.getRoomIdList()
  }

  async roomMemberList (roomId: string): Promise<string[]> {
    log.silly(PRE, `roomMemberList(${roomId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const roomIds = await this.manager.getRoomMemberIdList(roomId)
    return roomIds
  }

  protected async roomRawPayload (roomId: string): Promise<PadplusRoomPayload> {
    log.silly(PRE, `roomRawPayload(${roomId})`)

    const rawRoom = await this.manager.getRoomInfo(roomId)
    return rawRoom
  }

  protected async roomRawPayloadParser (rawPayload: PadplusRoomPayload): Promise<RoomPayload> {
    log.silly(PRE, `roomRawPayloadParser()`)

    const room = roomRawPayloadParser(rawPayload)
    return room
  }

  protected async roomMemberRawPayload (roomId: string, contactId: string): Promise<PadplusRoomMemberPayload> {
    log.silly(PRE, `roomMemberRawPayload(${roomId}, ${contactId})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const memberMap = await this.manager.getRoomMembers(roomId)
    if (!memberMap) {
      throw new Error('can not find members. may be you are removed.')
    }
    const member = memberMap[contactId]
    return member
  }

  protected async roomMemberRawPayloadParser (rawPayload: PadplusRoomMemberPayload): Promise<RoomMemberPayload> {
    log.silly(PRE, `roomMemberRawPayloadParser()`)

    const member = convertToPuppetRoomMember(rawPayload)
    return member
  }

  roomAnnounce (roomId: string): Promise<string>
  roomAnnounce (roomId: string, text: string): Promise<void>
  async roomAnnounce (roomId: any, text?: any): Promise<string | void> {
    log.silly(PRE, `roomAnnounce(${roomId}, ${typeof text === 'undefined' ? 'text is undefined' : text})`)

    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (typeof text === 'undefined') {
      return this.manager.getAnnouncement(roomId)
    } else {
      return this.manager.setAnnouncement(roomId, text)
    }
  }

  /**
   * External method
   */
  public async reconnect (): Promise<void> {
    log.silly(PRE, `reconnect()`)

    if (!this.manager) {
      throw new Error('no manager')
    }

    await this.manager.reconnect()
  }

  public async loginDevice (): Promise<LoginDeviceInfo> {
    log.silly(PRE, `loginDevice()`)

    if (!this.manager) {
      throw new Error('no manager')
    }

    return this.manager.loginDevice()
  }

  public ding (data?: string): void {
    log.silly(PRE, `ding(${data})`)
    const eventDongPayload: EventDongPayload = {
      data: data ? data! : 'ding-dong',
    }
    this.emit('dong', eventDongPayload)
  }

  private deduplicateRoomLeaveEvent (data: EventRoomLeavePayload) {
    const key = `${data.removeeIdList[0]}_${data.roomId}`
    if (data.removerId !== data.removeeIdList[0]) {
      this.leaveEventKey = key
      this.emit('room-leave', data)
    } else {
      if (this.leaveEventKey && this.leaveEventKey === key) {
        this.leaveEventKey = ''
      } else {
        this.emit('room-leave', data)
      }
    }
  }

}

export default PuppetPadplus
