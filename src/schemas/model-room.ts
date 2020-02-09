export interface PadplusRoomMemberPayload {
  contactId: string,
  nickName: string,
  displayName: string,
  bigHeadUrl: string,
  smallHeadUrl: string,
  inviterId: string,
}

export interface PadplusMemberBrief {
  UserName : string,
  NickName?: string,
}

export interface GrpcRoomMemberPayload {
  UserName: string,
  HeadImgUrl: string,
  DisplayName: string,
  RemarkName: string,
  NickName: string,
  isOwner?: string,
}

export interface GrpcRoomMemberList {
  roomId: string,
  membersJson: string,
}

export interface PadplusRoomPayload {
  alias          : string,
  bigHeadUrl     : string,
  chatRoomOwner  : string,
  chatroomVersion: number,
  contactType    : number,
  stranger       : string,
  members        : PadplusMemberBrief[],
  tagList     : string,
  nickName       : string,
  smallHeadUrl   : string,
  ticket         : string,
  chatroomId     : string,
  memberCount    : number,
  isDelete?      : boolean,
}

export interface GrpcRoomPayload {
  ContactType: number,
  ExtInfoExt: string,
  Sex: number,
  EncryptUsername: string,
  wechatUserName: string,
  PYQuanPin: string,
  Remark: string,
  LabelLists: string,
  ChatroomVersion: number,
  ExtInfo: string,
  ChatRoomOwner: string,
  VerifyFlag: number,
  ContactFlag: number,
  Ticket: string,
  UserName: string,
  src: number,
  HeadImgUrl: string,
  RemarkPYInitial: string,
  MsgType: number,
  City: string,
  NickName: string,
  Province: string,
  Alias: string,
  Signature: string,
  RemarkName: string,
  RemarkPYQuanPin: string,
  Uin: number,
  SmallHeadImgUrl: string,
  PYInitial: string,
  Seq: string,
  BigHeadImgUrl: string,
}

export interface PadplusRoomInvitationPayload {
  id       : string,
  fromUser : string,
  roomName : string,
  timestamp: number,
  url      : string,
}

export interface PadplusRoomInviteEvent {
  fromUser: string,
  msgId: string,
  roomName: string,
  timestamp: number,
  url: string,
}

export interface GrpcCreateRoomData {
  status: number,
  roomId: string,
  message: string,
  createMessage: GrpcCreateRoomMember[]
}

export interface GrpcCreateRoomMember {
  wxid: string,
  status: number,
}

export interface GrpcGetAnnouncementData {
  annoumcementPublisher: string,
  annoumcementPublishTime: number,
  message: string,
  status: number,
  announcement: string,
}

export interface GrpcSetAnnouncementData {
  message: string,
  content: string,
  status: number,
}

export interface PadplusRoomMemberMap {
  [contactId: string]: PadplusRoomMemberPayload
}

export interface GrpcAccpetRoomInvitation {
  chatRoomType: string,
  cmdid: string,
  inviteDetailUrl: string,
  inviteFrom: string,
  inviteUrl: string,
  loginer: string,
  queueName: string,
  source: string,
  uin: string,
  userName: string,
}
