import util from 'util'
import path from 'path'
import FileBox from 'file-box'
import flatten from 'array-flatten'

import {
  ContactPayload,
  MessagePayload,
  Receiver,
  FriendshipPayload,
  RoomMemberPayload,
  RoomPayload,
  UrlLinkPayload,
  MiniProgramPayload,
  PuppetOptions,
  ScanStatus,
  Puppet,
  RoomInvitationPayload,
  FriendshipType,
  FriendshipPayloadReceive,
  MessageType,
}                           from 'wechaty-puppet'

import {
  log,
  padplusToken,
  retry,
  GRPC_ENDPOINT,
  PADPLUS_REPLAY_MESSAGE,
}                                   from './config'

import PadplusManager from './padplus-manager/padplus-manager'
import { PadplusMessageType, PadplusError, PadplusErrorType, PadplusContactPayload, PadplusRoomPayload, GrpcQrCodeLogin, PadplusRoomMemberPayload, PadplusRoomInvitationPayload, FriendshipPayload as PadplusFriendshipPayload, SearchContactTypeStatus, GrpcSearchContact, PadplusMessageStatus } from './schemas'
import { PadplusMessagePayload, PadplusRichMediaData } from './schemas/model-message'
import { convertToPuppetRoomMember } from './convert-manager/room-convertor'
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser'
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser'
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser'
import { friendshipConfirmEventMessageParser, friendshipReceiveEventMessageParser, friendshipVerifyEventMessageParser } from './pure-function-helpers/friendship-event-message-parser'
import { messageRawPayloadParser, roomRawPayloadParser, friendshipRawPayloadParser, appMessageParser, isStrangerV2, isStrangerV1 } from './pure-function-helpers'
import { contactRawPayloadParser } from './pure-function-helpers/contact-raw-payload-parser'

const PRE = 'PUPPET_PADPLUS'

export class PuppetPadplus extends Puppet {

  private manager: PadplusManager

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
    log.silly(PRE, `start()`)

    this.state.on('pending')

    await this.startManager(this.manager)

    this.state.on(true)
  }

  private async startManager (manager: PadplusManager) {
    manager.on('scan', async (url: string, status: ScanStatus) => {
      log.silly(PRE, `scan : ${url}, status: ${status}`)
      this.emit('scan', url, status)
    })

    manager.on('login', async (loginData: GrpcQrCodeLogin) => {
      log.silly(PRE, `login success : ${util.inspect(loginData)}`)
      await super.login(loginData.userName)
      await this.manager.syncContacts()

    })

    manager.setMemory(this.memory)

    manager.on('message', msg => this.onMessage(msg))

    manager.on('ready', () => this.emit('ready'))

    await manager.start()
  }

  async onMessage (message: PadplusMessagePayload) {
    const messageType = message.msgType
    switch (messageType) {
      case PadplusMessageType.Sys:
        await Promise.all([
          this.onRoomJoinEvent(message),
          this.onRoomLeaveEvent(message),
          this.onRoomTopicEvent(message),
        ])
        break
      case PadplusMessageType.VerifyMsg:
        await this.onFriendshipEvent(message)
        break
      case PadplusMessageType.Recalled:
        this.emit('message', message.msgId)
        await this.onRoomJoinEvent(message)
        break
      case PadplusMessageType.Text:
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
      case PadplusMessageType.App:
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
        this.emit('message', message.msgId)
        break
    }
  }

  stop (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  logout (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  /**
   * ========================
   *     CONTACT SECTION
   * ========================
   */

  contactSelfQrcode (): Promise<string> {
    throw new Error('Method not implemented.')
  }

  contactSelfName (name: string): Promise<void> {
    log.silly(PRE, `name : ${util.inspect(name)}`)
    throw new Error('Method not implemented.')
  }

  contactSelfSignature (signature: string): Promise<void> {
    log.silly(PRE, `signature : ${util.inspect(signature)}`)
    throw new Error('Method not implemented.')
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
    log.verbose(PRE, `contactList()`)
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
    log.verbose(PRE, `contactRawPayloadParser()`)

    const payload = contactRawPayloadParser(rawPayload)
    return payload
  }

  /**
   * =========================
   *    FRIENDSHIP SECTION
   * =========================
   */

  async onFriendshipEvent (message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onPadplusMessageFriendshipEvent({id=%s})', message.msgId)
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
      this.emit('friendship', msgId)
    }
  }

  public async friendshipAdd (contactId: string, hello?: string): Promise<void> {
    log.verbose(PRE, `friendshipAdd(${contactId}, ${hello})`)

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    const searchContact: GrpcSearchContact = await this.manager.searchContact(contactId)
    /**
     * If the contact is not stranger, than using WXSearchContact can get userName
     */
    if (searchContact.wxid !== '' && !isStrangerV1(searchContact.v1) && !isStrangerV2(searchContact.v2)) {
      log.verbose(PRE, `friendshipAdd ${contactId} has been friend with bot, no need to send friend request!`)
      return
    }

    let strangerV1
    let strangerV2
    if (isStrangerV1(searchContact.v1)) {
      strangerV1 = searchContact.v1
      strangerV2 = searchContact.v2
    } else if (isStrangerV2(searchContact.v2)) {
      strangerV2 = searchContact.v2
      strangerV1 = searchContact.v1
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
    log.verbose(PRE, `friendshipAccept(${friendshipId})`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const payload = await this.manager.getFriendship(friendshipId)
    if (!payload || payload.type !== FriendshipType.Receive) {
      throw new Error(`friendship type error.`)
    }
    const { stranger, ticket } = payload as FriendshipPayloadReceive
    if (!stranger || !ticket) {
      throw new Error(`friendship data error, stranger or ticket is null.`)
    }
    await this.manager.confirmFriendship(stranger, ticket)
  }

  protected async friendshipRawPayload (friendshipId: string): Promise<PadplusFriendshipPayload> {
    log.silly(PRE, `friendshipId : ${util.inspect(friendshipId)}`)
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
    log.silly(PRE, `friendship rawPayload : ${util.inspect(rawPayload)}`)
    return rawPayload as FriendshipPayload
  }

  /**
   * ========================
   *      MESSAGE SECTION
   * ========================
   */

  public async messageFile (messageId: string): Promise<FileBox> {
    log.silly(PRE, `messageFile() messageId : ${util.inspect(messageId)}`)
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
        const data = await this.manager.loadRichMediaData(mediaData)
        if (data.src) {
          const name = path.parse(data.src).base
          return FileBox.fromUrl(encodeURI(data.src), name)
        } else {
          throw new Error(`can not get the media data`)
        }
      case MessageType.Emoticon:
        throw new Error(`not supported.`)
      case MessageType.Audio:
        if (rawPayload && rawPayload.url) {
          return FileBox.fromUrl(rawPayload.url)
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

  public async messageUrl (messageId: string): Promise<UrlLinkPayload> {
    log.silly(PRE, `messageUrl() messageId : ${util.inspect(messageId)}`)
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

  messageMiniProgram (messageId: string): Promise<MiniProgramPayload> {
    log.silly(PRE, `messageMiniProgram() messageId : ${util.inspect(messageId)}`)
    throw new Error('Method not implemented.')
  }

  public async messageForward (receiver: Receiver, messageId: string): Promise<void> {
    log.silly(PRE, `messageForward() receiver: ${receiver}, messageId : ${util.inspect(messageId)}`)

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
      throw new Error('Method Audio not supported.')
    } else if (payload.type === MessageType.Url) {
      await this.messageSendUrl(
        receiver,
        await this.messageUrl(messageId)
      )
    } else if (payload.type === MessageType.MiniProgram) {
      await this.messageSendMiniProgram(
        receiver,
        await this.messageMiniProgram(messageId)
      )
    } else if (payload.type === MessageType.Video) {
      throw new Error('Method Video not supported.')
    } else if (
      payload.type === MessageType.Attachment
      || payload.type === MessageType.ChatHistory
    ) {
      throw new Error('Method Video not supported.')
    } else {
      await this.messageSendFile(
        receiver,
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

  public async messageSendText (receiver: Receiver, text: string, mentionIdList?: string[]): Promise<void> {
    log.silly(PRE, 'messageSend(%s, %s)', JSON.stringify(receiver), text)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (mentionIdList && mentionIdList.length > 0) {
      const msgData = await this.manager.sendMessage(this.selfId(), contactIdOrRoomId!, text, PadplusMessageType.Text, mentionIdList.toString())
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, contactIdOrRoomId!, text, mentionIdList)
      }
    } else {
      const msgData = await this.manager.sendMessage(this.selfId(), contactIdOrRoomId!, text, PadplusMessageType.Text)
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, contactIdOrRoomId!, text)
      }
    }

  }

  private replayTextMsg (msgId: string, to: string, text: string, atUserList?: string[]): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.Text
    payload.content = text
    if (atUserList) {
      payload.msgSource = `<msgsource>\n\t<atuserlist>${atUserList.join(',')}</atuserlist>\n</msgsource>\n`
    }
    log.silly(PRE, 'replayTextMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  public async messageSendContact (receiver: Receiver, contactId: string): Promise<void> {
    log.verbose(PRE, `messageSend('%s', %s)`, receiver, contactId)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    let contact = await this.manager.getContact(contactId)
    if (contact) {
      const content = {
        headImgUrl: contact.smallHeadUrl,
        nickName: contact.nickName,
        userName: contact.userName,
      }
      const contactData = await this.manager.sendContact(this.selfId(), contactIdOrRoomId!, JSON.stringify(content))
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayContactMsg(contactData.msgId, contactIdOrRoomId!, JSON.stringify(content))
      }
    } else {
      throw new Error('not able to send contact')
    }
  }

  private replayContactMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.ShareCard
    payload.content = content
    log.silly(PRE, 'replayContactMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  public async messageSendFile (receiver: Receiver, file: FileBox): Promise<void> {
    log.verbose(PRE, 'messageSendFile(%s, %s)', receiver, file)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    const fileUrl = await this.manager.generatorFileUrl(file)
    const fileSize = (await file.toBuffer()).length
    log.silly(PRE, `file url : ${util.inspect(fileUrl)}`)
    // this needs to run before mimeType is available
    await file.ready()

    const type = (file.mimeType && file.mimeType !== 'application/octet-stream')
      ? file.mimeType
      : path.extname(file.name)

    if (!this.id) {
      throw new PadplusError(PadplusErrorType.NO_ID, 'messageSendFile()')
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
        const picData = await this.manager.sendFile(this.id, contactIdOrRoomId!, decodeURIComponent(fileUrl), file.name, 'pic')
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayImageMsg(picData.msgId, contactIdOrRoomId!, decodeURIComponent(fileUrl))
        }
        break
      case 'video/mp4':
      case '.mp4':
        const videoData = await this.manager.sendFile(this.id, contactIdOrRoomId!, fileUrl, file.name, 'video')
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(videoData.msgId, contactIdOrRoomId!, fileUrl)
        }
        break
      default:
        const docData = await this.manager.sendFile(this.id, contactIdOrRoomId!, fileUrl, file.name, 'doc', fileSize)
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(docData.msgId, contactIdOrRoomId!, fileUrl)
        }
        break
    }
  }

  private replayImageMsg (msgId: string, to: string, url: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.Image
    payload.content = `<msg>${url}</msg>`
    payload.url = url
    log.silly(PRE, 'replayImageMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  private replayAppMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = `<msg>${content}</msg>`
    log.silly(PRE, 'replayAppMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  public async messageSendUrl (receiver: Receiver, urlLinkPayload: UrlLinkPayload): Promise<void> {
    log.verbose(PRE, `messageSendUrl(${receiver})`,
      JSON.stringify(receiver),
      JSON.stringify(urlLinkPayload),
    )

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (!this.id) {
      throw new PadplusError(PadplusErrorType.NO_ID, `messageSendUrl()`)
    }
    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload = {
      des: description,
      thumburl: thumbnailUrl,
      title,
      type: 5,
      url,
    }
    const urlLinkData = await this.manager.sendUrlLink(this.id, contactIdOrRoomId!, JSON.stringify(payload))
    if (PADPLUS_REPLAY_MESSAGE) {
      this.replayUrlLinkMsg(urlLinkData.msgId, contactIdOrRoomId!, JSON.stringify(payload))
    }
  }

  private replayUrlLinkMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = content
    log.silly(PRE, 'replayUrlLinkMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  messageSendMiniProgram (receiver: Receiver, miniProgramPayload: MiniProgramPayload): Promise<void> {
    log.silly(PRE, `messageSendMiniProgram() receiver : ${util.inspect(receiver)}, miniProgramPayload: ${miniProgramPayload}`)
    throw new Error('Method not implemented.')
  }

  public async messageRawPayload (messageId: string): Promise<PadplusMessagePayload> {
    log.verbose(PRE, 'messageRawPayload(%s)', messageId)

    const rawPayload = await this.manager.cachePadplusMessagePayload.get(messageId)
    if (!rawPayload) {
      throw new Error('no message rawPayload')
    }
    return rawPayload
  }

  public async messageRawPayloadParser (rawPayload: PadplusMessagePayload): Promise<MessagePayload> {
    log.verbose(PRE, 'messageRawPayloadParser()')

    const payload = await messageRawPayloadParser(rawPayload)

    return payload
  }

  /**
   * ========================
   *      ROOM SECTION
   * ========================
   */

  async onRoomJoinEvent (message: PadplusMessagePayload): Promise<void> {
    const joinEvent = await roomJoinEventMessageParser(message)
    if (joinEvent) {
      log.silly(PRE, `receive join event : ${util.inspect(joinEvent)}`)
      const inviteeNameList = joinEvent.inviteeNameList
      const inviterName     = joinEvent.inviterName
      const roomId          = joinEvent.roomId
      const timestamp       = joinEvent.timestamp

      const inviteeIdList = await retry(async (retryException, attempt) => {
        log.verbose(PRE, 'onPadplusMessageRoomEventJoin({id=%s}) roomJoin retry(attempt=%d)', attempt)

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

        if (!this.manager) {
          throw new Error('no manager')
        }

        /**
         * Set Cache Dirty
         */
        await this.roomMemberPayloadDirty(roomId)

        return retryException(new Error('roomMemberSearch() not found'))

      }).catch(e => {
        log.verbose(PRE, 'onPadplusMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
        return [] as string[]
      })

      const inviterIdList = await this.roomMemberSearch(roomId, inviterName)

      if (inviterIdList.length < 1) {
        throw new Error('no inviterId found')
      } else if (inviterIdList.length > 1) {
        log.verbose(PRE, 'onPadplusMessageRoomEventJoin() inviterId found more than 1, use the first one.')
      }

      const inviterId = inviterIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-join', roomId, inviteeIdList,  inviterId, timestamp)
    }
  }

  async onRoomLeaveEvent (message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onRoomLeaveEvent({id=%s})', message.msgId)

    const leaveEvent = roomLeaveEventMessageParser(message)

    if (leaveEvent) {
      log.silly(PRE, `receive remove event : ${util.inspect(leaveEvent)}`)
      const leaverNameList = leaveEvent.leaverNameList
      const removerName    = leaveEvent.removerName
      const roomId         = leaveEvent.roomId
      const timestamp      = leaveEvent.timestamp

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
        log.verbose(PRE, 'onPadplusMessageRoomEventLeave(): removerId found more than 1, use the first one.')
      }
      const removerId = removerIdList[0]

      if (!this.manager) {
        throw new Error('no padplusManager')
      }

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-leave', roomId, leaverIdList, removerId, timestamp)
    }
  }

  async onRoomTopicEvent (message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onPadplusMessageRoomEventTopic({id=%s})', message.msgId)

    const topicEvent = roomTopicEventMessageParser(message)

    if (topicEvent) {
      log.silly(PRE, `receive topic event : ${util.inspect(topicEvent)}`)
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
        log.verbose(PRE, 'onPadplusMessageRoomEventTopic() changerId found more than 1, use the first one.')
      }
      const changerId = changerIdList[0]

      if (!this.manager) {
        throw new Error('no padplusManager')
      }
      /**
       * Set Cache Dirty
       */
      await this.roomPayloadDirty(roomId)
      if (this.manager && this.manager.cacheManager) {
        await this.manager.cacheManager.deleteRoom(roomId)
      }
      this.emit('room-topic', roomId, newTopic, oldTopic, changerId, timestamp)
    }
  }

  roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.silly(PRE, `roomInvitationId : ${util.inspect(roomInvitationId)}`)
    throw new Error('Method not implemented.')
  }

  protected async roomInvitationRawPayload (roomInvitationId: string): Promise<PadplusRoomInvitationPayload> {
    log.silly(PRE, `roomInvitationId : ${util.inspect(roomInvitationId)}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const payload = await this.manager.roomInvitationRawPayload(roomInvitationId)
    return payload
  }

  protected async roomInvitationRawPayloadParser (rawPayload: PadplusRoomInvitationPayload): Promise<RoomInvitationPayload> {
    log.silly(PRE, `room invitation rawPayload : ${util.inspect(rawPayload)}`)
    const payload: RoomInvitationPayload = {
      id: rawPayload.id,
      inviterId: rawPayload.fromUser,
      roomMemberCount: 0,
      roomMemberIdList: [],
      roomTopic: rawPayload.roomName,
      timestamp: rawPayload.timestamp,
    }
    return payload
  }

  public async roomAdd (roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, contactId: ${contactId}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    await this.manager.roomAddMember(roomId, contactId)
  }

  roomAvatar (roomId: string): Promise<FileBox> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error('Method not implemented.')
  }

  public async roomCreate (contactIdList: string[], topic?: string | undefined): Promise<string> {
    log.silly(PRE, `topic : ${topic}, contactIdList: ${contactIdList.join(',')}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (!this.id) {
      throw new Error(`no id.`)
    }
    contactIdList.push(this.id)
    const result = await this.manager.createRoom(topic || '', contactIdList)
    return result
  }

  public async roomDel (roomId: string, contactId: string): Promise<void> {
    log.verbose(PRE, `roomDel(${roomId}, ${contactId})`)

    const memberIdList = await this.roomMemberList(roomId)
    if (memberIdList.includes(contactId)) {
      await this.manager.deleteRoomMember(roomId, contactId)
    } else {
      log.verbose(PRE, `roomDel() room(${roomId}) has no member contact(${contactId})`)
    }
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    await this.manager.quitRoom(roomId)
  }

  public async roomTopic (roomId: string): Promise<string>
  public async roomTopic (roomId: string, topic: string): Promise<void>
  public async roomTopic (roomId: string, topic?: string | undefined): Promise<string | void>
  public async roomTopic (roomId: string, topic?: any): Promise<string | void> {
    log.silly(PRE, `roomId : ${roomId}, topic: ${topic}`)
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

  roomQrcode (roomId: string): Promise<string> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error('Method not implemented.')
  }

  async roomList (): Promise<string[]> {
    log.verbose(PRE, `roomList()`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const roomIds = await this.manager.getRoomIdList()
    return roomIds
  }

  async roomMemberList (roomId: string): Promise<string[]> {
    log.silly(PRE, `roomMemberList(), roomId : ${util.inspect(roomId)}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const roomIds = await this.manager.getRoomMemberIdList(roomId)
    return roomIds
  }

  protected async roomRawPayload (roomId: string): Promise<PadplusRoomPayload> {
    log.silly(PRE, `roomRawPayload(), roomId : ${roomId}`)
    const rawRoom = await this.manager.getRoomInfo(roomId)
    return rawRoom
  }

  protected async roomRawPayloadParser (rawPayload: PadplusRoomPayload): Promise<RoomPayload> {
    log.silly(PRE, `roomRawPayloadParser()`)
    const room = roomRawPayloadParser(rawPayload)
    return room
  }

  protected async roomMemberRawPayload (roomId: string, contactId: string): Promise<PadplusRoomMemberPayload> {
    log.silly(PRE, `roomId : ${roomId}, contactId: ${contactId}`)
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
    log.silly(PRE, `room member rawPayload : ${util.inspect(rawPayload)}`)
    const member = convertToPuppetRoomMember(rawPayload)
    return member
  }

  roomAnnounce (roomId: string): Promise<string>
  roomAnnounce (roomId: string, text: string): Promise<void>
  async roomAnnounce (roomId: any, text?: any): Promise<string | void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, text: ${text}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (text) {
      await this.manager.setAnnouncement(roomId, text)
    } else {
      log.warn(`get room announcement is not supported by wechaty-puppet-padplus.`)
      return ''
    }
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

}

export default PuppetPadplus
