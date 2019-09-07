import { ContactGender } from 'wechaty-puppet'

import {
  ContactOperationBitVal,
  ContactOperationCmdId,
  GrpcSelfAvatarType,
  PadplusMessageStatus,
  PadplusMessageType,
  PadplusRoomMemberFlag,
} from './padplus-enums'

export interface GrpcQrCode {
  qrcodeId: string,
  qrcode: string,
}

export interface GrpcQrCodeStatus {
  head_url: string,
  user_name: string,
  nick_name: string,
  status: number,
}

export interface GrpcQrCodeLogin {
  headImgUrl: string,
  nickName: string,
  status: number,
  uin: string,
  userName: string,
  verifyFlag: string,
}

/**
 * 
 * old
 * 
 */
export interface GrpcMessagePayload {
  msgId: number,
  fromUserName: string,
  toUserName: string,
  msgType: PadplusMessageType,
  content: string,
  status: PadplusMessageStatus,
  imgStatus: number,
  imgBuf: string | null,
  createTime: number,
  msgSource: string,
  pushContent: string,
  newMsgId: number
}

export interface GrpcSelfInfoPayload {
  alias: string,                           // "",             -> weixin id
  bindUin: string,                         // 251642490,      -> QQ number
  msgType: PadplusMessageType,              // 101,
  signature: string,                       // "",
  userName: string,                        // "lylezhuifeng", -> unique id
  nickName: string,                        // "高原ོ",
  sex: ContactGender,                      // 1,
  province: string,                        // "Beijing",
  city: string,                            // "",
  bindEmail: string,                       // "lylezhuifeng@qq.com",
  bindMobile: string,                      // "13999999999"
}

export interface GrpcSelfAvatarPayload {
  msgType: PadplusMessageType,                      // 35,
  imgType: GrpcSelfAvatarType,                     // 1,
  imgLen: number,                                  // 4218,
  imgBuf: string,                                  // "/5FQ9qFCup5OcSStjioHU0GNcbDPiSmkusuMq6kqHtQoUoTjVpATIcA7KwKftA0KFZ2WIkou2APWkl/vLohKtwBnFChQXYZE5DJCRUk0TmhQqIguCcUKFCmAf/Z",
  imgMd5: string,                                  // "0144847978f6667ed59cc3d2b4350eb5",
  bigHeadImgUrl: string,                           // "http://wx.qlogo.cn/mmhead/KDLS0iaeMdibHvaeoZVaPM/132",
  smallHeadImgUrl: string,                         // "http://wx.qlogo.cn/mmhead/KDLS0fhbZw1jQScfCqfVaPM/0"
}

export interface GrpcDeletedPayload {
  msgType: PadplusMessageType,
  userName: string,
}

export type GrpcSyncMessagePayload = GrpcMessagePayload
                                   | GrpcRoomRawPayload
                                   | GrpcSelfInfoPayload
                                   | GrpcSelfAvatarPayload
                                   | GrpcDeletedPayload

/**
 * ******************************************************************************************************************
 * ----------------------------------------- Room related interface -------------------------------------------------
 * ******************************************************************************************************************
 * ******************************************************************************************************************
 */

// Room payload
// {
//   "Alias": "",
//   "BigHeadImgUrl": "http://wx.qlogo.cn/mmcrhead/22YD2oBcVUbuonH5SPq6GlD7fW1cHZiadZTGnAIny0PXdj7GEBYV3M5FHv3GicYBySftwQibDQiaahE0pU7phNiaH02wItnlKibOfp/0",
//   "ChatRoomOwner": "wxid_3xl8j2suau8b22",
//   "ChatroomVersion": 700001442
//   "City": "",
//   "ContactType": 0,
//   "EncryptUsername": "v1_97cdf15ad29268aff9af5c79ef0696c13711214e4c4bd9fba4ae17c4317b90907b4a738d9c31dabd9c710720f3936efd@stranger",
//   "ExtInfo": "[{\"Wxid\":\"wxid_1\",\"NickName\":\"nick\"},{\"Wxid\":\"wxid_2\",\"NickName\":\"nick\"}]",
//   "ExtInfoExt": "wxid_1,wxid_2"
//   "LabelLists": "",
//   "MsgType": 2,
//   "NickName": "Wechaty Developers' Home 2",
//   "Province": "",
//   "Remark": "",
//   "Sex": 0,
//   "Signature": "",
//   "SmallHeadImgUrl": "",
//   "Ticket": "",
//   "UserName": "5729603967@chatroom",
//   "VerifyFlag": 1,
// }
export interface GrpcRoomRawPayload {
  alias          : string,
  bigHeadImgUrl  : string,
  chatRoomOwner  : string,
  chatroomVersion: number
  contactType    : number,
  encryptUsername: string,
  extInfo        : string,
  extInfoExt     : string,
  labelLists     : string,
  msgType        : PadplusMessageType,
  nickName       : string,
  smallHeadImgUrl: string,
  ticket         : string,
  userName       : string,
  verifyFlag     : number,
}

// Room member payload
// {
//   "ChatroomUsername": "1111@chatroom",
//   "ServerVersion": 700000033,
//   "MemberDetails": [{
//     "Username": "wxid_z2",
//     "NickName": "小桔测试",
//     "DisplayName": "",
//     "BigHeadImgUrl": "http://wx.qlogo.cn/mmhead/ver_1/V9HJ2jFv1eS0a4yj",
//     "SmallHeadImgUrl": "http://wx.qlogo.cn/mmhead/ver_1/V9HJ2jFv1pxib6p",
//     "ChatroomMemberFlag": 0,
//     "InviterUserName": "wxid_zm"
//   }]
// }
export interface GrpcRoomMemberRawPayload {
  chatroomUsername: string,
  serverVersion: number,
  memberDetails: GrpcRoomMemberDetail[] | null,
}

export interface GrpcRoomMemberDetail {
  userName: string,
  nickName: string,
  displayName: string,
  bigHeadImgUrl: string,
  smallHeadImgUrl: string,
  chatroomMemberFlag: PadplusRoomMemberFlag,
  inviterUserName: string,
}

export interface GrpcContactOperationOption {
  cmdid: ContactOperationCmdId,
  userId: string,
  bitVal?: ContactOperationBitVal,
  remark?: string,
}

// {
//   "Roomeid": "8316342888@chatroom",
//   "Members": [{
//     "MemberName": "wxid_dz1jpaw94eo712",
//     "MemberStatus": 4
//   }]
// }
export interface GrpcCreateRoomMemberPayload {
  memberName: string,
  memberStatus: number,
}
export interface GrpcCreateRoomPayload {
  roomeid: string,
  members: GrpcCreateRoomMemberPayload[]
}

export interface GrpcGetMsgImageType {
  imageData: string,
}

export interface GrpcGetMsgVoiceType {
  voiceData: string,
}

export interface GrpcGetA8KeyType {
  url: string,
  xWechatKey: string,
  xWechatUin: string,
}

export interface GrpcGetContactQrcodePayload {
  qrcodeBuf: string,
  foterWording: string,
}

export interface GrpcGetCdnDnsPayload {
  dnsCdn: {
    ver: string,
    uin: string,
    ip: string,
    aesKey: string,
  },
  snsCdn: {
    ver: string,
    uin: string,
    ip: string,
    aesKey: string,
  },
  appCdn: {
    ver: string,
    uin: string,
    ip: string,
    aesKey: string,
  },
  clientVersion: number,
}

export enum GRPC_CODE {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  UNAUTHENTICATED = 16,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
}
