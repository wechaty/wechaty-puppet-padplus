import util from 'util'
import path from 'path'
import FileBox from 'file-box'
import { flatten } from 'array-flatten'

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

import { RequestQueue } from './padplus-manager/api-request/request-queue'
import PadplusManager from './padplus-manager/padplus-manager'
import { PadplusMessageType, PadplusContactPayload, PadplusRoomPayload, GrpcQrCodeLogin, PadplusRoomMemberPayload, PadplusRoomInvitationPayload, FriendshipPayload as PadplusFriendshipPayload, SearchContactTypeStatus, GrpcSearchContact, PadplusMessageStatus, GetContactSelfInfoGrpcResponse } from './schemas'
import { PadplusMessagePayload, PadplusRichMediaData, GrpcResponseMessageData } from './schemas/model-message'
import { convertToPuppetRoomMember } from './convert-manager/room-convertor'
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser'
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser'
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser'
import { friendshipConfirmEventMessageParser, friendshipReceiveEventMessageParser, friendshipVerifyEventMessageParser } from './pure-function-helpers/friendship-event-message-parser'
import { messageRawPayloadParser, roomRawPayloadParser, friendshipRawPayloadParser, appMessageParser, isStrangerV2, isStrangerV1, isRoomId } from './pure-function-helpers'
import { contactRawPayloadParser } from './pure-function-helpers/contact-raw-payload-parser'
import { xmlToJson } from './pure-function-helpers/xml-to-json'

const PRE = 'PuppetPadplus'

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

    manager.on('reset', (reason: string) => {
      this.emit('reset', reason)
    })

    manager.on('heartbeat', (data: string) => {
      this.emit('watchdog', {
        data,
      })
    })

    manager.on('logout', (reason?: string) => this.logout(true, reason))

    manager.on('error', (err: Error) => {
      this.emit('error', err)
    })
    await manager.start()
  }

  public async stop (): Promise<void> {
    log.verbose(PRE, 'stop()')

    if (!this.manager) {
      throw new Error('no padplus manager')
    }

    if (this.state.off()) {
      log.verbose(PRE, 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    await this.manager.stop()
    await this.manager.removeAllListeners()

    this.state.off(true)
    log.verbose(PRE, `stop() finished`)
  }

  public async logout (force?: boolean, reason?: string): Promise<void> {
    log.verbose(PRE, `logout(${reason})`)
    if (!force) {
      await this.manager.logout(this.selfId())
    }
    this.emit('logout', this.selfId(), reason)
    this.id = undefined
    this.emit('reset', 'padplus reset')
  }

  async onMessage (message: PadplusMessagePayload) {
    const messageType = message.msgType

    if (isRoomId(message.fromUserName)) {
      await this.roomRawPayload(message.fromUserName)
    } else {
      await this.contactRawPayload(message.fromUserName)
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
        this.emit('message', message.msgId)
        await this.onRoomJoinEvent(message)
        break
      case PadplusMessageType.Text:
        await this.onFriendshipEvent(message)
        this.emit('message', message.msgId)
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

  /**
   * ========================
   *     CONTACT SECTION
   * ========================
   */

  public async contactSelfQrcode (): Promise<string> {
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
    const { contactId, stranger, ticket } = payload as FriendshipPayloadReceive
    if (!stranger || !ticket) {
      throw new Error(`friendship data error, stranger or ticket is null.`)
    }
    await this.manager.confirmFriendship(contactId, stranger, ticket)
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

  public async messageContact (messageId: string): Promise<string> {
    throw new Error(`not implement`)
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
      throw new Error('Message type Audio not supported.')
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
    } else if (payload.type === MessageType.ChatHistory) {
      throw new Error('Message type ChatHistory not supported.')
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

  public async messageSendText (receiver: Receiver, text: string, mentionIdList?: string[]): Promise<void | string> {
    log.silly(PRE, 'messageSend(%s, %s)', JSON.stringify(receiver), text)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    let msgData: GrpcResponseMessageData
    if (mentionIdList && mentionIdList.length > 0) {
      msgData = await this.manager.sendMessage(this.selfId(), contactIdOrRoomId!, text, PadplusMessageType.Text, mentionIdList.toString())
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, contactIdOrRoomId!, text, mentionIdList)
      }
    } else {
      msgData = await this.manager.sendMessage(this.selfId(), contactIdOrRoomId!, text, PadplusMessageType.Text)
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayTextMsg(msgData.msgId, contactIdOrRoomId!, text)
      }
    }
    if (msgData.success) {
      const msgPayload: PadplusMessagePayload = {
        content: text + ((mentionIdList && mentionIdList.length > 0) ? mentionIdList!.toString() : ''),
        createTime: msgData.timestamp,
        fromUserName: this.selfId(),
        imgStatus: 0,
        l1MsgType: 0,
        msgId: msgData.msgId,
        msgSource: 'self',
        msgSourceCd: 0,
        msgType: PadplusMessageType.Text,
        newMsgId: Number(msgData.msgId),
        pushContent: text,
        status: 1,
        toUserName: contactIdOrRoomId!,
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
      payload.msgSource = `<msgsource>\n\t<atuserlist>${atUserList.join(',')}</atuserlist>\n</msgsource>\n`
    }
    log.silly(PRE, 'replayTextMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  public async messageSendContact (receiver: Receiver, contactId: string): Promise<void | string> {
    log.verbose(PRE, `messageSend('%s', %s)`, receiver, contactId)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    let contact = await this.manager.getContact(contactId)
    if (contact) {
      const content = {
        headImgUrl: contact.smallHeadUrl,
        nickName: contact.nickName,
        userName: contact.userName,
      }
      const contactData: GrpcResponseMessageData = await this.manager.sendContact(this.selfId(), contactIdOrRoomId!, JSON.stringify(content))
      if (PADPLUS_REPLAY_MESSAGE) {
        this.replayContactMsg(contactData.msgId, contactIdOrRoomId!, JSON.stringify(content))
      }
      if (contactData.success) {
        const msgPayload: PadplusMessagePayload = {
          content: JSON.stringify(content),
          createTime: contactData.timestamp,
          fromUserName: this.selfId(),
          imgStatus: 0,
          l1MsgType: 0,
          msgId: contactData.msgId,
          msgSource: 'self',
          msgSourceCd: 0,
          msgType: PadplusMessageType.Text,
          newMsgId: Number(contactData.msgId),
          pushContent: JSON.stringify(content),
          status: 1,
          toUserName: contactIdOrRoomId!,
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
    this.emit('message', payload.msgId)
  }

  public async messageSendFile (receiver: Receiver, file: FileBox): Promise<void | string> {
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

    log.silly(PRE, `fileType ${type}`)
    switch (type) {
      case '.slk':
        throw new Error('not support')
      case 'image/jpeg':
      case 'image/png':
      case '.jpg':
      case '.jpeg':
      case '.png':
        const picData = await this.manager.sendFile(this.selfId(), contactIdOrRoomId!, decodeURIComponent(fileUrl), file.name, 'pic')
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayImageMsg(picData.msgId, contactIdOrRoomId!, decodeURIComponent(fileUrl))
        }
        if (picData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: picData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: picData.msgId,
            msgSource: 'self',
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(picData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: contactIdOrRoomId!,
            uin: '',
            wechatUserName: '',
          }
          this.manager.cachePadplusMessagePayload.set(picData.msgId, msgPayload)
        }
        return picData.msgId
      case 'video/mp4':
      case '.mp4':
        const videoData = await this.manager.sendFile(this.selfId(), contactIdOrRoomId!, fileUrl, file.name, 'video')
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(videoData.msgId, contactIdOrRoomId!, fileUrl)
        }
        if (videoData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: videoData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: videoData.msgId,
            msgSource: 'self',
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(videoData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: contactIdOrRoomId!,
            uin: '',
            wechatUserName: '',
          }
          this.manager.cachePadplusMessagePayload.set(videoData.msgId, msgPayload)
        }
        return videoData.msgId
      case 'application/xml':
        throw new Error(`Can not parse the url data, please input a name for FileBox.fromUrl(url, name).`)
      default:
        const docData = await this.manager.sendFile(this.selfId(), contactIdOrRoomId!, fileUrl, file.name, 'doc', fileSize)
        if (PADPLUS_REPLAY_MESSAGE) {
          this.replayAppMsg(docData.msgId, contactIdOrRoomId!, fileUrl)
        }
        if (docData.success) {
          const msgPayload: PadplusMessagePayload = {
            content: `<msg>${fileUrl}</msg>`,
            createTime: docData.timestamp,
            fromUserName: this.selfId(),
            imgStatus: 0,
            l1MsgType: 0,
            msgId: docData.msgId,
            msgSource: 'self',
            msgSourceCd: 0,
            msgType: PadplusMessageType.Text,
            newMsgId: Number(docData.msgId),
            pushContent: `<msg>${fileUrl}</msg>`,
            status: 1,
            toUserName: contactIdOrRoomId!,
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
    this.emit('message', payload.msgId)
  }

  private replayAppMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = `<msg>${content}</msg>`
    log.silly(PRE, 'replayAppMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  public async messageSendUrl (receiver: Receiver, urlLinkPayload: UrlLinkPayload): Promise<void | string> {
    log.verbose(PRE, `messageSendUrl(${receiver})`,
      JSON.stringify(receiver),
      JSON.stringify(urlLinkPayload),
    )

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload = {
      description,
      thumburl: thumbnailUrl,
      title,
      type: 5,
      url,
    }
    const urlLinkData = await this.manager.sendUrlLink(this.selfId(), contactIdOrRoomId!, JSON.stringify(payload))
    if (PADPLUS_REPLAY_MESSAGE) {
      this.replayUrlLinkMsg(urlLinkData.msgId, contactIdOrRoomId!, JSON.stringify(payload))
    }
    if (urlLinkData.success) {
      const msgPayload: PadplusMessagePayload = {
        content: JSON.stringify(payload),
        createTime: urlLinkData.timestamp,
        fromUserName: this.selfId(),
        imgStatus: 0,
        l1MsgType: 0,
        msgId: urlLinkData.msgId,
        msgSource: 'self',
        msgSourceCd: 0,
        msgType: PadplusMessageType.Text,
        newMsgId: Number(urlLinkData.msgId),
        pushContent: JSON.stringify(payload),
        status: 1,
        toUserName: contactIdOrRoomId!,
        uin: '',
        wechatUserName: '',
      }
      this.manager.cachePadplusMessagePayload.set(urlLinkData.msgId, msgPayload)
    }
    log.silly(PRE, `urlLinkData : ${util.inspect(urlLinkData)}`)
    return urlLinkData.msgId
  }

  private replayUrlLinkMsg (msgId: string, to: string, content: string): void {
    const payload = this.generateBaseMsg(msgId, to)
    payload.msgType = PadplusMessageType.App
    payload.content = content
    log.silly(PRE, 'replayUrlLinkMsg replaying message: %s', JSON.stringify(payload))
    this.emit('message', payload.msgId)
  }

  messageSendMiniProgram (receiver: Receiver, miniProgramPayload: MiniProgramPayload): Promise<void | string> {
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

    if (payload.mentionIdList && payload.mentionIdList.length === 1 && payload.mentionIdList[0] === 'announcement@all') {
      const memberIds = await this.roomMemberList(payload.roomId!)
      payload.mentionIdList = memberIds.filter(m => m !== payload.fromId)
      payload.text = `${payload.text || ''}`
    }

    return payload
  }

  public async messageRecall (messageId: string): Promise<boolean> {
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

        /**
         * Set Cache Dirty
         */
        await this.roomMemberPayloadDirty(roomId)

        return retryException(new Error('roomMemberSearch() not found'))

      }).catch(e => {
        log.verbose(PRE, 'onPadplusMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
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

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.silly(PRE, `roomAvatar(roomId : ${util.inspect(roomId)})`)
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
    log.silly(PRE, `topic : ${topic}, contactIdList: ${contactIdList.join(',')}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
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

  async roomQrcode (roomId: string): Promise<string> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    return this.manager.getRoomQrcode(roomId)
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
  async roomAnnounce (roomId: any, text?: string | null): Promise<string | void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, text: ${text}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (typeof text !== 'undefined') {
      return this.manager.setAnnouncement(roomId, text)
    } else {
      return this.manager.getAnnouncement(roomId)
    }
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

}

export default PuppetPadplus
