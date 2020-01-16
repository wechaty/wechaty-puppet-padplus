/* eslint camelcase: 0 */
import { ContactGender } from 'wechaty-puppet'

import {
  ContactOperationBitVal,
  ContactOperationCmdId,
  GrpcSelfAvatarType,
  PadplusMessageType,
  PadplusRoomMemberFlag,
} from './padplus-enums'

export interface GrpcQrCode {
  qrcodeId: string,
  qrcode: string,
}

export interface GrpcQrCodeStatus {
  head_url: string,
  nick_name: string,
  status: number,
  user_name: string,
}

export interface GrpcQrCodeLogin {
  alias: string,
  headImgUrl: string,
  nickName: string,
  status: number,
  uin: string,
  userName: string,
  verifyFlag: string,
}

export interface GrpcMessagePayload {
  AppMsgType?: number,
  Content: string,
  CreateTime: number,
  fileName?: string,
  FileName?: string,
  fromMemberNickName?: string,
  FromMemberNickName?: string,
  FromMemberUserName?: string,
  fromMemberUserName?: string,
  FromUserName: string,
  ImgBuf?: string,
  ImgStatus: number,
  L1MsgType: number,
  MsgId: string,
  MsgSource: string,
  msgSourceCd: number,
  MsgType: number,
  NewMsgId: number,
  PushContent: string,
  Status: number,
  ToUserName: string,
  Uin: string
  Url?: string,
  url?: string,
  wechatUserName: string,
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

export interface GrpcRoomRawPayload {
  alias          : string,
  bigHeadImgUrl  : string,
  chatRoomOwner  : string,
  chatroomVersion: number
  contactType    : number,
  encryptUsername: string,
  extInfo        : string,
  extInfoExt     : string,
  tagList     : string,
  msgType        : PadplusMessageType,
  nickName       : string,
  smallHeadImgUrl: string,
  ticket         : string,
  userName       : string,
  verifyFlag     : number,
}

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
