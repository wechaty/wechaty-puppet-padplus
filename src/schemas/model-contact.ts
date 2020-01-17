import {
  ContactGender,
} from 'wechaty-puppet'

export interface PadplusContactPayload {
  alias            : string,
  contactType      : number,
  tagList       : string,
  bigHeadUrl       : string,                     // "http://wx.qlogo.cn/mmhead/ver_1/xfCMmibHH74xGLoyeDFJadrZXX3eOEznPefiaCa3iczxZGMwPtDuSbRQKx3Xdm18un303mf0NFia3USY2nO2VEYILw/0",
  city             : string,                     // 'Haidian'
  country          : string,                     // "CN"
  nickName         : string,                     // "梦君君", Contact: 用户昵称， Room: 群昵称
  province         : string,                     // "Beijing",
  remark           : string,                     // "女儿",
  sex              : ContactGender,
  signature        : string,                     // "且行且珍惜",
  smallHeadUrl     : string,
  stranger         : string,                     // 用户v1码，从未加过好友则为空 "v1_0468f2cd3f0efe7ca2589d57c3f9ba952a3789e41b6e78ee00ed53d1e6096b88@stranger"
  ticket           : string,                     // 用户v2码，如果非空则为单向好友(非对方好友) 'v2_xxx@stranger'
  userName         : string,                     // "mengjunjun001" | "qq512436430" Unique name
  verifyFlag       : number,
  contactFlag      : number,
}

export interface GrpcContactPayload {
  Alias: string,
  BigHeadImgUrl: string,
  ChatRoomOwner: string,
  ChatroomVersion: number,
  City: string,
  ContactFlag: number,
  ContactType: string,
  EncryptUsername: string,
  ExtInfo: string,
  ExtInfoExt: string,
  HeadImgUrl: string,
  LabelLists: string,
  MsgType: number,
  NickName: string,
  Province: string,
  PYInitial: string,
  PYQuanPin: string,
  Remark: string,
  RemarkName: string,
  RemarkPYInitial: string,
  RemarkPYQuanPin: string,
  Seq: string,
  Sex: number,
  Signature: string,
  SmallHeadImgUrl: string,
  Type7?: string,
  Uin: number,
  UserName: string,
  VerifyFlag: number,
  wechatUserName: string,
}

export interface GrpcSearchContact {
  avatar: string,
  v1: string,
  v2: string,
  searchId: string,
  nickName: string,
  wxid: string,
  message: string,
  status: string,
}

export interface GrpcDeleteContact {
  field: string,
  loginer: string,
  mqType: number,
  source: string,
  uin: string,
  userName: string,
}

export interface ContactQrcodeGrpcResponse {
  status: number,
  message: string,
  loginer: string,
  uin: string,
  userName: string,
  queueName: string,
  qrcodeBuf: string,
  style: number,
}

export interface SetContactSelfInfoGrpcResponse {
  status: number,
  message: string,
  loginer: string,
  uin: string,
  userName: string,
  queueName: string,
  updateData: ContactSelfUpdateInfo,
}

export interface ContactSelfUpdateInfo {
  nickName?: string,
  sex?: number,
  area?: string,
  signature?: string,
}

export interface GetContactSelfInfoGrpcResponse {
  alias: string,
  bigHeadImg: string,
  bindEmail: string,
  bindMobile: string,
  bindQQ: number,
  bytes: string,
  city: string,
  country: string,
  loginer: string,
  message: string,
  nickName: string,
  province: string,
  queueName: string,
  sex: number,
  signature: string,
  smallHeadImg: string,
  snsBGImg: string,
  status: number,
  uin: string,
  userName: string,
}
