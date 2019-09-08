import {
  ContactGender,
} from 'wechaty-puppet'

export interface PadplusContactPayload {
  alias            : string,
  contactType      : number,
  labelLists       : string,
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
}

export interface GrpcContactPayload {
  ContactType: string,
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
  UserName: string,
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
