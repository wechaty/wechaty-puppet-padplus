/* eslint-disable */
import util from 'util'
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
import { PadplusContactPayload } from './schemas';
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

  // /**
  //  * ========================
  //  *     CONTACT SECTION
  //  * ========================
  //  */

  // contactSelfQrcode(): Promise<string> {
  //   throw new Error("Method not implemented.")
  // }

  // contactSelfName(name: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // contactSelfSignature(signature: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  contactAlias(contactId: string): Promise<string>
  contactAlias(contactId: string, alias: string | null): Promise<void>
  public async contactAlias(contactId: string, alias?: string | null): Promise<string | void>  {
    log.silly(PRE, `contactId and alias : ${util.inspect(contactId)}`)
    if (typeof alias === 'undefined') {
      const payload = await this.contactRawPayload(contactId);
      return payload.alias || ''
    }

    if (!this.manager) {
      throw new Error(`no padplus manage.`)
    }
    // await this.manager.setContactAlias(contactId, alias || '')
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
    // const contactIds = await this.manager.getContactIdList();
    const contactIdList: string [] = [];
    return contactIdList;
  }

  protected contactRawPayload(contactId: string): Promise<PadplusContactPayload> {
    if (!this.id) {
      throw new Error(`bot not login.`)
    }

  }

  protected contactRawPayloadParser(rawPayload: any): Promise<ContactPayload> {
    throw new Error("Method not implemented.")
  }

  public async contactPayload (
    contactId: string,
  ): Promise<ContactPayload> {
    // const result: ContactPayload = {}
    // return  result;
  }

  // /**
  //  * =========================
  //  *    FRIENDSHIP SECTION
  //  * =========================
  //  */

  // friendshipAdd(contactId: string, hello?: string | undefined): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // friendshipAccept(friendshipId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // protected friendshipRawPayload(friendshipId: string): Promise<any> {
  //   throw new Error("Method not implemented.")
  // }

  // protected friendshipRawPayloadParser(rawPayload: any): Promise<FriendshipPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // /**
  //  * ========================
  //  *      MESSAGE SECTION
  //  * ========================
  //  */

  // messageFile(messageId: string): Promise<FileBox> {
  //   throw new Error("Method not implemented.")
  // }

  // messageUrl(messageId: string): Promise<UrlLinkPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // messageMiniProgram(messageId: string): Promise<MiniProgramPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // messageForward(receiver: Receiver, messageId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // messageSendText(receiver: Receiver, text: string, mentionIdList?: string[] | undefined): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // messageSendContact(receiver: Receiver, contactId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // messageSendFile(receiver: Receiver, file: FileBox): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // messageSendUrl(receiver: Receiver, urlLinkPayload: UrlLinkPayload): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // messageSendMiniProgram(receiver: Receiver, miniProgramPayload: MiniProgramPayload): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // protected messageRawPayload(messageId: string): Promise<any> {
  //   throw new Error("Method not implemented.")
  // }

  // protected messageRawPayloadParser(rawPayload: any): Promise<MessagePayload> {
  //   throw new Error("Method not implemented.")
  // }

  // /**
  //  * ========================
  //  *      ROOM SECTION
  //  * ========================
  //  */
  // roomInvitationAccept(roomInvitationId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomInvitationRawPayload(roomInvitationId: string): Promise<any> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomInvitationRawPayloadParser(rawPayload: any): Promise<RoomInvitationPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // roomAdd(roomId: string, contactId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // roomAvatar(roomId: string): Promise<FileBox> {
  //   throw new Error("Method not implemented.")
  // }

  // roomCreate(contactIdList: string[], topic?: string | undefined): Promise<string> {
  //   throw new Error("Method not implemented.")
  // }

  // roomDel(roomId: string, contactId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // roomQuit(roomId: string): Promise<void> {
  //   throw new Error("Method not implemented.")
  // }

  // roomTopic(roomId: string): Promise<string>
  // roomTopic(roomId: string, topic: string): Promise<void>
  // roomTopic(roomId: string, topic?: string | undefined): Promise<string | void>
  // roomTopic(roomId: any, topic?: any): Promise<string | void> {
  //   throw new Error("Method not implemented.")
  // }

  // roomQrcode(roomId: string): Promise<string> {
  //   throw new Error("Method not implemented.")
  // }

  // roomList(): Promise<string[]> {
  //   throw new Error("Method not implemented.")
  // }

  // roomMemberList(roomId: string): Promise<string[]> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomRawPayload(roomId: string): Promise<any> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomRawPayloadParser(rawPayload: any): Promise<RoomPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomMemberRawPayload(roomId: string, contactId: string): Promise<any> {
  //   throw new Error("Method not implemented.")
  // }

  // protected roomMemberRawPayloadParser(rawPayload: any): Promise<RoomMemberPayload> {
  //   throw new Error("Method not implemented.")
  // }

  // roomAnnounce(roomId: string): Promise<string>
  // roomAnnounce(roomId: string, text: string): Promise<void>
  // roomAnnounce(roomId: any, text?: any): Promise<string | void> {
  //   throw new Error("Method not implemented.")
  // }

  // public ding (data?: string): void {
  //   log.silly(PRE, 'ding(%s)', data || '')
  //   this.emit('dong', data)
  // }
  

  /**
   * =========================
   *    FRIENDSHIP SECTION
   * =========================
   */

  friendshipAdd(contactId: string, hello?: string | undefined): Promise<void> {
    throw new Error("Method not implemented.")
  }

  friendshipAccept(friendshipId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  protected friendshipRawPayload(friendshipId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected friendshipRawPayloadParser(rawPayload: any): Promise<FriendshipPayload> {
    throw new Error("Method not implemented.")
  }

  /**
   * ========================
   *      MESSAGE SECTION
   * ========================
   */

  messageFile(messageId: string): Promise<FileBox> {
    throw new Error("Method not implemented.")
  }

  messageUrl(messageId: string): Promise<UrlLinkPayload> {
    throw new Error("Method not implemented.")
  }

  messageMiniProgram(messageId: string): Promise<MiniProgramPayload> {
    throw new Error("Method not implemented.")
  }

  messageForward(receiver: Receiver, messageId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  messageSendText(receiver: Receiver, text: string, mentionIdList?: string[]): Promise<void> {
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

  messageSendContact(receiver: Receiver, contactId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  messageSendFile(receiver: Receiver, file: FileBox): Promise<void> {
    throw new Error("Method not implemented.")
  }

  messageSendUrl(receiver: Receiver, urlLinkPayload: UrlLinkPayload): Promise<void> {
    throw new Error("Method not implemented.")
  }

  messageSendMiniProgram(receiver: Receiver, miniProgramPayload: MiniProgramPayload): Promise<void> {
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
    throw new Error("Method not implemented.")
  }

  protected roomInvitationRawPayload(roomInvitationId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected roomInvitationRawPayloadParser(rawPayload: any): Promise<RoomInvitationPayload> {
    throw new Error("Method not implemented.")
  }

  roomAdd(roomId: string, contactId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  roomAvatar(roomId: string): Promise<FileBox> {
    throw new Error("Method not implemented.")
  }

  roomCreate(contactIdList: string[], topic?: string | undefined): Promise<string> {
    throw new Error("Method not implemented.")
  }

  roomDel(roomId: string, contactId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  roomQuit(roomId: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  roomTopic(roomId: string): Promise<string>
  roomTopic(roomId: string, topic: string): Promise<void>
  roomTopic(roomId: string, topic?: string | undefined): Promise<string | void>
  roomTopic(roomId: any, topic?: any): Promise<string | void> {
    throw new Error("Method not implemented.")
  }

  roomQrcode(roomId: string): Promise<string> {
    throw new Error("Method not implemented.")
  }

  roomList(): Promise<string[]> {
    throw new Error("Method not implemented.")
  }

  roomMemberList(roomId: string): Promise<string[]> {
    throw new Error("Method not implemented.")
  }

  protected roomRawPayload(roomId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected roomRawPayloadParser(rawPayload: any): Promise<RoomPayload> {
    throw new Error("Method not implemented.")
  }

  protected roomMemberRawPayload(roomId: string, contactId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected roomMemberRawPayloadParser(rawPayload: any): Promise<RoomMemberPayload> {
    throw new Error("Method not implemented.")
  }

  roomAnnounce(roomId: string): Promise<string>
  roomAnnounce(roomId: string, text: string): Promise<void>
  roomAnnounce(roomId: any, text?: any): Promise<string | void> {
    throw new Error("Method not implemented.")
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

}

export default PuppetPadplus
