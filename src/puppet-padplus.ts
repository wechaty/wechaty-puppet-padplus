/* eslint-disable */
import util from 'util'
import path from 'path'
import FileBox from 'file-box'
import flatten from 'array-flatten'

import {
  ContactPayload,
  FriendshipPayload,
  MessagePayload,
  Receiver,
  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,
  UrlLinkPayload,
  MiniProgramPayload,
  PuppetOptions,
  ScanStatus,
  Puppet,
}                           from 'wechaty-puppet'
// import { xmlToJson } from './pure-function-helpers/xml-to-json'

import {
  log,
  padplusToken,
  retry,
}                                   from './config'

import PadplusManager from './padplus-manager/padplus-manager'
import { PadplusMessageType, PadplusError, PadplusErrorType, PadplusContactPayload, PadplusRoomPayload, GrpcQrCodeLogin, PadplusRoomMemberPayload } from './schemas';
import { PadplusMessagePayload } from './schemas/model-message';
import { convertMessageFromPadplusToPuppet } from './convert-manager/message-convertor';
import { convertToPuppetContact } from './convert-manager/contact-convertor';
import { convertToPuppetRoom, convertToPuppetRoomMember } from './convert-manager/room-convertor';
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser';
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser';
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser';
import { friendshipConfirmEventMessageParser, friendshipReceiveEventMessageParser, friendshipVerifyEventMessageParser } from './pure-function-helpers/friendship-event-message-parser';

const PRE = 'PUPPET_PADPLUS'

export class PuppetPadplus extends Puppet {

  private manager: PadplusManager

  constructor (
    public options: PuppetOptions = {},
  ) {
    super(options)

    const token = options.token || padplusToken()
    const name = options.name
    if (token) {
      this.manager = new PadplusManager({
        token,
        memory: this.memory,
        name,
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
      await this.manager.syncContacts()

      this.emit('login', loginData.userName)
    })

    manager.on('message', message => this.onMessage(message))

    await manager.start()
  }

  async onMessage(message: PadplusMessagePayload) {
    log.silly(`==P==A==D==P==L==U==S==<padplus.ts receive message>==P==A==D==P==L==U==S==`)
    log.silly(PRE, `receive message : ${util.inspect(message)}`)
    const messageType = message.msgType
    switch(messageType) {
      case PadplusMessageType.Text:
      case PadplusMessageType.Contact:
      case PadplusMessageType.Image:
      case PadplusMessageType.Deleted:
      case PadplusMessageType.Voice:
      case PadplusMessageType.SelfAvatar:
      case PadplusMessageType.VerifyMsg:
        await this.onFriendshipEvent(message)
        break
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
        this.emit('message', message.msgId)
        break
      case PadplusMessageType.Sys:
        await Promise.all([
          this.onRoomJoinEvent(message),
          this.onRoomLeaveEvent(message),
          this.onRoomTopicEvent(message),
        ])
        break
      case PadplusMessageType.Recalled:
      case PadplusMessageType.N11_2048:
      case PadplusMessageType.N15_32768:
      default:
    }
  }

  stop(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  logout(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  /**
   * ========================
   *     CONTACT SECTION
   * ========================
   */

  contactSelfQrcode(): Promise<string> {
    throw new Error("Method not implemented.")
  }

  contactSelfName(name: string): Promise<void> {
    log.silly(PRE, `name : ${util.inspect(name)}`)
    throw new Error("Method not implemented.")
  }

  contactSelfSignature(signature: string): Promise<void> {
    log.silly(PRE, `signature : ${util.inspect(signature)}`)
    throw new Error("Method not implemented.")
  }

  contactAlias(contactId: string): Promise<string>
  contactAlias(contactId: string, alias: string | null): Promise<void>
  public async contactAlias(contactId: string, alias?: string | null): Promise<string | void>  {
    log.silly(PRE, `contactId and alias : ${util.inspect(contactId)}`)
    if (typeof alias === 'undefined') {
      const payload = await this.contactPayload(contactId);
      return payload.alias || ''
    }

    if (!this.manager) {
      throw new Error(`no padplus manage.`)
    }
    const selfId = this.selfId()
    await this.manager.setContactAlias(selfId, contactId, alias || '')
    // await this.manager.updateContact(contactId)
  }

  contactAvatar(contactId: string): Promise<FileBox>
  contactAvatar(contactId: string, file: FileBox): Promise<void>
  public async contactAvatar(contactId: string, file?: FileBox): Promise<FileBox | void> {
    if (file) {
      if (contactId !== this.selfId()) {
        throw new Error(`can not set avatar for others.`)
      }
      if (!this.manager) {
        throw new Error(`no padplus manager.`)
      }
      return
      // TODO: set avatar for self.
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

  public async contactList(): Promise<string[]> {
    log.verbose(PRE, `contactList()`)
    if (!this.manager) {
      throw new Error(`no padplus manager.`)
    }
    const selfId = this.selfId()
    const contactIds = await this.manager.getContactIdList(selfId)
    return contactIds
  }

  protected async contactRawPayload(contactId: string): Promise<PadplusContactPayload> {
    if (!this.id) {
      throw new Error(`bot not login.`)
    }
    if (!this.manager) {
      throw new Error(`no manager.`)
    }

    const payload = await this.manager.getContactPayload(contactId)
    return payload
  }

  protected async contactRawPayloadParser(rawPayload: PadplusContactPayload): Promise<ContactPayload> {
    const payload = convertToPuppetContact(rawPayload)
    return payload
  }

  /**
   * =========================
   *    FRIENDSHIP SECTION
   * =========================
   */

  async onFriendshipEvent(message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onPadproMessageFriendshipEvent({id=%s})', message.msgId)
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

    // if (friendshipReceiveContactId) {
    //   interface XmlSchema {
    //     msg: {
    //       $: {
    //         fromusername    : string,
    //         encryptusername : string,
    //         content         : string,
    //         ticket          : string,
    //       },
    //     }
    //   }
    
    //   try {
    //     const jsonPayload: XmlSchema = await xmlToJson(
    //       message.content,
    //     )
    
    //     const v1 = jsonPayload.msg.$.encryptusername
    //     const ticket = jsonPayload.msg.$.ticket
    //     log.silly(`==P==A==D==P==L==U==S==<receive friendship>==P==A==D==P==L==U==S==`)
    //     log.silly(PRE, `v1 and v2 : ${util.inspect(v1)};;;${ticket}`)
    //     await this.confirmFriendship(v1, ticket)
    //   } catch (e) {
    //     // not receive event
    //   }
    // }

    if (friendshipConfirmContactId
        || friendshipReceiveContactId
        || friendshipVerifyContactId
    ) {
      // Maybe load contact here since we know a new friend is added
      this.emit('friendship', message.msgId)
    }
  }

  async confirmFriendship(v1: string, ticket: string) {
    await this.manager.confirmFriendship(v1, ticket)
  }

  friendshipAdd(contactId: string, hello?: string | undefined): Promise<void> {
    log.silly(PRE, `contactId : ${util.inspect(contactId)}, hello: ${hello}`)
    throw new Error("Method not implemented.")
  }

  friendshipAccept(friendshipId: string): Promise<void> {
    log.silly(PRE, `friendshipId : ${util.inspect(friendshipId)}`)
    throw new Error("Method not implemented.")
  }

  protected friendshipRawPayload(friendshipId: string): Promise<any> {
    log.silly(PRE, `friendshipId : ${util.inspect(friendshipId)}`)
    throw new Error("Method not implemented.")
  }

  protected friendshipRawPayloadParser(rawPayload: any): Promise<FriendshipPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    throw new Error("Method not implemented.")
  }

  /**
   * ========================
   *      MESSAGE SECTION
   * ========================
   */

  messageFile(messageId: string): Promise<FileBox> {
    log.silly(PRE, `messageFile() messageId : ${util.inspect(messageId)}`)
    throw new Error("Method not implemented.")
  }

  messageUrl(messageId: string): Promise<UrlLinkPayload> {
    log.silly(PRE, `messageUrl() messageId : ${util.inspect(messageId)}`)
    throw new Error("Method not implemented.")
  }

  messageMiniProgram(messageId: string): Promise<MiniProgramPayload> {
    log.silly(PRE, `messageMiniProgram() messageId : ${util.inspect(messageId)}`)
    throw new Error("Method not implemented.")
  }

  messageForward(receiver: Receiver, messageId: string): Promise<void> {
    log.silly(PRE, `messageForward() receiver: ${receiver}, messageId : ${util.inspect(messageId)}`)
    throw new Error("Method not implemented.")
  }

  public async messageSendText(receiver: Receiver, text: string, mentionIdList?: string[]): Promise<void> {
    log.silly(PRE, 'messageSend(%s, %s)', JSON.stringify(receiver), text)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (this.id) {
      if (mentionIdList && mentionIdList.length > 0) {
        await this.manager.sendMessage(this.id, contactIdOrRoomId!, text, PadplusMessageType.Text, mentionIdList.toString())
      } else {
        await this.manager.sendMessage(this.id, contactIdOrRoomId!, text, PadplusMessageType.Text)
      }
    } else {
      throw new Error('Can not get the logined account id')
    }

  }

  public async messageSendContact(receiver: Receiver, contactId: string): Promise<void> {
    log.verbose(PRE, 'messageSend("%s", %s)', util.inspect(receiver), contactId)

    if (!this.id) {
      throw new PadplusError(PadplusErrorType.NO_ID, 'messageSendContact()')
    }

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    await this.manager.sendContact(this.id, contactIdOrRoomId!, contactId)
  }

  public async messageSendFile(receiver: Receiver, file: FileBox): Promise<void> {
    log.verbose(PRE, 'messageSendFile(%s, %s)', receiver, file)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    const fileUrl = await this.manager.generatorFileUrl(file)
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
        await this.manager.sendFile(this.id, contactIdOrRoomId!, fileUrl, file.name, 'pic')
        break
      case '.mp4':
        await this.manager.sendFile(this.id, contactIdOrRoomId!, fileUrl, file.name, 'video')
        break
      default:
        await this.manager.sendFile(this.id, contactIdOrRoomId!, fileUrl, file.name, 'doc')
        break
    }
  }

  public async messageSendUrl (receiver: Receiver, urlLinkPayload: UrlLinkPayload): Promise<void> {
    log.verbose(PRE, 'messageSendUrl("%s", %s)',
      JSON.stringify(receiver),
      JSON.stringify(urlLinkPayload),
    )

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (!this.id) {
      throw new PadplusError(PadplusErrorType.NO_ID, `messageSendUrl()`)
    }

    await this.manager.sendUrlLink(this.id, contactIdOrRoomId!, urlLinkPayload)
  }

  messageSendMiniProgram(receiver: Receiver, miniProgramPayload: MiniProgramPayload): Promise<void> {
    log.silly(PRE, `messageSendMiniProgram() receiver : ${util.inspect(receiver)}, miniProgramPayload: ${miniProgramPayload}`)
    throw new Error("Method not implemented.")
  }

  protected async messageRawPayload(messageId: string): Promise<PadplusMessagePayload> {
    log.verbose(PRE, 'messageRawPayload(%s)', messageId)

    const rawPayload = await this.manager.cachePadplusMessagePayload.get(messageId)
    if (!rawPayload) {
      throw new Error('no rawPayload')
    }

    return rawPayload
  }

  protected async messageRawPayloadParser(rawPayload: PadplusMessagePayload): Promise<MessagePayload> {
    log.verbose(PRE, 'messageRawPayloadParser(%s)', rawPayload)

    const payload = await convertMessageFromPadplusToPuppet(rawPayload)

    return payload //{} as MessagePayload
  }

  /**
   * ========================
   *      ROOM SECTION
   * ========================
   */

  async onRoomJoinEvent(message: PadplusMessagePayload): Promise<void> {
    const joinEvent = await roomJoinEventMessageParser(message)
    if (joinEvent) {
      log.silly(`==P==A==D==P==L==U==S==<room join event>==P==A==D==P==L==U==S==`)
      log.silly(PRE, `receive join event : ${util.inspect(joinEvent)}`)
      const inviteeNameList = joinEvent.inviteeNameList
      const inviterName     = joinEvent.inviterName
      const roomId          = joinEvent.roomId
      const timestamp       = joinEvent.timestamp
      log.silly(PRE, 'onRoomJoinEvent() roomJoinEvent="%s"', JSON.stringify(joinEvent))

      const inviteeIdList = await retry(async (retryException, attempt) => {
        log.verbose(PRE, 'onPadproMessageRoomEventJoin({id=%s}) roomJoin retry(attempt=%d)', attempt)

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
        log.verbose(PRE, 'onPadproMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
        return [] as string[]
      })

      const inviterIdList = await this.roomMemberSearch(roomId, inviterName)

      if (inviterIdList.length < 1) {
        throw new Error('no inviterId found')
      } else if (inviterIdList.length > 1) {
        log.verbose(PRE, 'onPadproMessageRoomEventJoin() inviterId found more than 1, use the first one.')
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
  async onRoomLeaveEvent(message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onRoomLeaveEvent({id=%s})', message.msgId)

    const leaveEvent = roomLeaveEventMessageParser(message)

    if (leaveEvent) {
      log.silly(`==P==A==D==P==L==U==S==<roomLeaveEvent>==P==A==D==P==L==U==S==`)
      log.silly(PRE, `receive remove event : ${util.inspect(leaveEvent)}`)
      const leaverNameList = leaveEvent.leaverNameList
      const removerName    = leaveEvent.removerName
      const roomId         = leaveEvent.roomId
      const timestamp      = leaveEvent.timestamp
      log.silly(PRE, 'onRoomLeaveEvent() onRoomLeaveEvent="%s"', JSON.stringify(leaveEvent))

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
        log.verbose(PRE, 'onPadproMessageRoomEventLeave(): removerId found more than 1, use the first one.')
      }
      const removerId = removerIdList[0]

      if (!this.manager) {
        throw new Error('no padproManager')
      }

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-leave', roomId, leaverIdList, removerId, timestamp)
    }
  }
  async onRoomTopicEvent(message: PadplusMessagePayload): Promise<void> {
    log.verbose(PRE, 'onPadproMessageRoomEventTopic({id=%s})', message.msgId)

    const topicEvent = roomTopicEventMessageParser(message)

    if (topicEvent) {
      log.silly(`==P==A==D==P==L==U==S==<room topic event>==P==A==D==P==L==U==S==`)
      log.silly(PRE, `receive topic event : ${util.inspect(topicEvent)}`)
      const changerName = topicEvent.changerName
      const newTopic    = topicEvent.topic
      const roomId      = topicEvent.roomId
      const timestamp   = topicEvent.timestamp
      log.silly(PRE, 'onPadproMessageRoomEventTopic() roomTopicEvent="%s"', JSON.stringify(topicEvent))

      const roomOldPayload = await this.roomPayload(roomId)
      const oldTopic       = roomOldPayload.topic

      const changerIdList = await this.roomMemberSearch(roomId, changerName)
      if (changerIdList.length < 1) {
        throw new Error('no changerId found')
      } else if (changerIdList.length > 1) {
        log.verbose(PRE, 'onPadproMessageRoomEventTopic() changerId found more than 1, use the first one.')
      }
      const changerId = changerIdList[0]

      if (!this.manager) {
        throw new Error('no padproManager')
      }
      /**
       * Set Cache Dirty
       */
      await this.roomPayloadDirty(roomId)

      this.emit('room-topic', roomId, newTopic, oldTopic, changerId, timestamp)
    }
  }
  
  roomInvitationAccept(roomInvitationId: string): Promise<void> {
    log.silly(PRE, `roomInvitationId : ${util.inspect(roomInvitationId)}`)
    throw new Error("Method not implemented.")
  }

  protected roomInvitationRawPayload(roomInvitationId: string): Promise<any> {
    log.silly(PRE, `roomInvitationId : ${util.inspect(roomInvitationId)}`)
    throw new Error("Method not implemented.")
  }

  protected roomInvitationRawPayloadParser(rawPayload: any): Promise<RoomInvitationPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    throw new Error("Method not implemented.")
  }

  roomAdd(roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, contactId: ${contactId}`)
    throw new Error("Method not implemented.")
  }

  roomAvatar(roomId: string): Promise<FileBox> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  roomCreate(contactIdList: string[], topic?: string | undefined): Promise<string> {
    log.silly(PRE, `contactIdList : ${util.inspect(contactIdList)}, topic: ${topic}`)
    throw new Error("Method not implemented.")
  }

  roomDel(roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, contactId: ${contactId}`)
    throw new Error("Method not implemented.")
  }

  roomQuit(roomId: string): Promise<void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  roomTopic(roomId: string): Promise<string>
  roomTopic(roomId: string, topic: string): Promise<void>
  roomTopic(roomId: string, topic?: string | undefined): Promise<string | void>
  async roomTopic(roomId: string, topic?: any): Promise<string | void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, topic: ${topic}`)
    if (typeof topic === 'undefined') {
      const room = await this.roomPayload(roomId)
      return room && room.topic || ''
    }
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (!this.id) {
      throw new Error(`not bot logined.`)
    }
    const selfId = this.selfId()
    await this.manager.setRoomTopic(selfId, roomId, topic as string)
    await new Promise(r => setTimeout(r, 500))
    await this.roomTopic(roomId)
  }

  roomQrcode(roomId: string): Promise<string> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  async roomList(): Promise<string[]> {
    log.verbose(PRE, `roomList()`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const roomIds = await this.manager.getRoomIdList()
    return roomIds
  }

  async roomMemberList(roomId: string): Promise<string[]> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    const roomIds = await this.manager.getRoomMemberIdList(roomId)
    return roomIds
  }

  protected async roomRawPayload(roomId: string): Promise<PadplusRoomPayload> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    const rawRoom = await this.manager.getRoomInfo(roomId)
    return rawRoom
  }

  protected async roomRawPayloadParser(rawPayload: PadplusRoomPayload): Promise<RoomPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    const room = convertToPuppetRoom(rawPayload)
    return room
  }

  protected async roomMemberRawPayload(roomId: string, contactId: string): Promise<PadplusRoomMemberPayload> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, contactId: ${contactId}`)
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

  protected async roomMemberRawPayloadParser(rawPayload: PadplusRoomMemberPayload): Promise<RoomMemberPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    const member = convertToPuppetRoomMember(rawPayload)
    return member
  }

  roomAnnounce(roomId: string): Promise<string>
  roomAnnounce(roomId: string, text: string): Promise<void>
  async roomAnnounce(roomId: any, text?: any): Promise<string | void> {
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
