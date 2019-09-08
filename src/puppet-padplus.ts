/* eslint-disable */
import util from 'util'
import path from 'path'
import FileBox from 'file-box'

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

import {
  log,
  padplusToken,
}                                   from './config'

import PadplusManager from './padplus-manager/padplus-manager'
import { PadplusMessageType, PadplusError, PadplusErrorType } from './schemas';
import { PadplusMessagePayload } from './schemas/model-message';
import { convertMessageFromPadplusToPuppet } from './convert-manager/message-convertor';

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
        name,
      })
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {
    log.silly(PRE, `start()`)

    // this.state.on('pending')

    await this.startManager(this.manager)

    // this.state.on(true)
  }

  private async startManager (manager: PadplusManager) {
    manager.on('scan', async (url: string, status: ScanStatus) => {
      log.silly(PRE, `scan : ${url}, status: ${status}`)
    })

    manager.on('login', async (loginData: string) => {
      log.silly(PRE, `scan : ${util.inspect(loginData)}`)
    })

    await manager.start()
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
    throw new Error("Method not implemented.")
  }

  contactSelfSignature(signature: string): Promise<void> {
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
    return contactIds;
  }

  // protected contactRawPayload(contactId: string): Promise<PadplusContactPayload> {
  //   if (!this.id) {
  //     throw new Error(`bot not login.`)
  //   }

  // }

  // protected contactRawPayloadParser(rawPayload: any): Promise<ContactPayload> {
  //   throw new Error("Method not implemented.")
  // }

  public async contactPayload (
    contactId: string,
  ): Promise<ContactPayload> {
    if (!this.manager) {
      throw new Error(`no manager.`)
    }
    if (!this.id) {
      throw new Error(`no bot logined.`)
    }
    const selfId = this.selfId()
    const result: ContactPayload = await this.manager.getContact(selfId, contactId)
    return  result;
  }

  /**
   * =========================
   *    FRIENDSHIP SECTION
   * =========================
   */

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
        // TODO: 群中@某人
        // await this.room.atRoomMember(this.id, contactIdOrRoomId!, mentionIdList.join(','), text)
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
        await this.manager.sendMessage(this.id, contactIdOrRoomId!, fileUrl, PadplusMessageType.Image)
        break
      case '.mp4':
        await this.manager.sendMessage(this.id, contactIdOrRoomId!, fileUrl, PadplusMessageType.Video)
        break
      default:
        await this.manager.sendMessage(this.id, contactIdOrRoomId!, fileUrl, PadplusMessageType.App) // TODO: file.name
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

    return payload
  }

  /**
   * ========================
   *      ROOM SECTION
   * ========================
   */
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
  roomTopic(roomId: any, topic?: any): Promise<string | void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, topic: ${topic}`)
    throw new Error("Method not implemented.")
  }

  roomQrcode(roomId: string): Promise<string> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  roomList(): Promise<string[]> {
    throw new Error("Method not implemented.")
  }

  roomMemberList(roomId: string): Promise<string[]> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  protected roomRawPayload(roomId: string): Promise<any> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}`)
    throw new Error("Method not implemented.")
  }

  protected roomRawPayloadParser(rawPayload: any): Promise<RoomPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    throw new Error("Method not implemented.")
  }

  protected roomMemberRawPayload(roomId: string, contactId: string): Promise<any> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, contactId: ${contactId}`)
    throw new Error("Method not implemented.")
  }

  protected roomMemberRawPayloadParser(rawPayload: any): Promise<RoomMemberPayload> {
    log.silly(PRE, `rawPayload : ${util.inspect(rawPayload)}`)
    throw new Error("Method not implemented.")
  }

  roomAnnounce(roomId: string): Promise<string>
  roomAnnounce(roomId: string, text: string): Promise<void>
  roomAnnounce(roomId: any, text?: any): Promise<string | void> {
    log.silly(PRE, `roomId : ${util.inspect(roomId)}, text: ${text}`)
    throw new Error("Method not implemented.")
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

}

export default PuppetPadplus
