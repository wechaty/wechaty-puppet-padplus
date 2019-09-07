import util from 'util'
import { FileBox } from 'file-box'

import {
  ContactPayload,
  FriendshipPayload,
  MessagePayload,
  Puppet,
  PuppetOptions,
  Receiver,
  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,
  UrlLinkPayload,
  MiniProgramPayload,
}                           from 'wechaty-puppet'

import {
  GRPC_ENDPOINT,
  log,
  macproToken,
}                                   from './config'
import { GrpcGateway } from './server-manager/grpc-gateway'

const PRE = 'PUPPET_MACPRO'

export class PuppetMacpro extends Puppet {

  private loopTimer?: NodeJS.Timer

  private grpcGateway: GrpcGateway

  constructor (
    public options: PuppetOptions = {},
  ) {
    super(options)

    const token = options.token || macproToken()
    if (token) {
      this.grpcGateway = new GrpcGateway(token, GRPC_ENDPOINT)
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {
    log.silly(PRE, `start()`)

    this.state.on('pending')


    await this.grpcGateway.initGrpcGateway()

    this.state.on(true)
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
  contactAlias(contactId: any, alias?: any) {
    log.silly(PRE, `contactId and alias : ${util.inspect(contactId)}`)
    throw new Error("Method not implemented.")
  }

  contactAvatar(contactId: string): Promise<FileBox>
  contactAvatar(contactId: string, file: FileBox): Promise<void>
  contactAvatar(contactId: any, file?: any) {
    throw new Error("Method not implemented.")
  }

  contactList(): Promise<string[]> {
    throw new Error("Method not implemented.")
  }

  protected contactRawPayload(contactId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected contactRawPayloadParser(rawPayload: any): Promise<ContactPayload> {
    throw new Error("Method not implemented.")
  }

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

  messageSendText(receiver: Receiver, text: string, mentionIdList?: string[] | undefined): Promise<void> {
    throw new Error("Method not implemented.")
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

  protected messageRawPayload(messageId: string): Promise<any> {
    throw new Error("Method not implemented.")
  }

  protected messageRawPayloadParser(rawPayload: any): Promise<MessagePayload> {
    throw new Error("Method not implemented.")
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
  roomTopic(roomId: any, topic?: any) {
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
  roomAnnounce(roomId: any, text?: any) {
    throw new Error("Method not implemented.")
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
