import {
  GrpcVoiceFormat,
  PadplusEmojiType,
  PadplusMessageType,
  WechatAppMessageType,
} from './padplus-enums'

export interface PadplusRichMediaData {
  content: string,
  msgType: number,
  contentType: string,
  src?: string,
  appMsgType?: number,
  fileName: string,
  msgId: string,
  createTime: number,
  fromUserName: string,
  toUserName: string,
}

export interface PadplusMessageSource {
  silence?: boolean,
  memberCount?: number,
  imageFileName?: string,
  atUserList?: string[],
}

export interface GrpcResponseMessageData {
  msgId: string,
  timestamp: number,
  success: boolean,
}

export interface PadplusMessagePayload {
  appMsgType?: number,
  content: string,
  createTime: number,
  fileName?: string,
  fromMemberNickName?: string,
  fromMemberUserName?: string,
  fromUserName: string,
  imgBuf?: string,
  imgStatus: number,
  l1MsgType: number,
  msgId: string,
  msgSource: string,
  msgSourceCd: number,
  msgType: PadplusMessageType,
  newMsgId: number,
  pushContent: string,
  status: number,
  toUserName: string,
  uin: string
  url?: string,
  wechatUserName: string,
}

export interface PadplusAppMessagePayload {
  des?          : string,
  thumburl?     : string,
  title         : string,
  url           : string,
  appattach?    : PadplusAppAttachPayload,
  type          : WechatAppMessageType,
  md5?          : string,
  fromusername? : string,
  recorditem?   : string,
}

export interface PadplusAppAttachPayload {
  totallen?      : number,
  attachid?      : string,
  emoticonmd5?   : string,
  fileext?       : string,
  cdnattachurl?  : string,
  aeskey?        : string,
  cdnthumbaeskey?: string,
  encryver?      : number,
  islargefilemsg : number,
}

export interface PadplusEmojiMessagePayload {
  cdnurl: string,
  type  : PadplusEmojiType,
  len   : number,
  width : number,
  height: number,
}

export interface PadplusImageMessagePayload {
  aesKey: string,
  encryVer: number,
  cdnThumbAesKey: string,
  cdnThumbUrl: string,
  cdnThumbLength: number,
  cdnThumbHeight: number,
  cdnThumbWidth: number,
  cdnMidHeight: number,
  cdnMidWidth: number,
  cdnHdHeight: number,
  cdnHdWidth: number,
  cdnMidImgUrl: string,
  length?: number,
  cdnBigImgUrl?: string,
  hdLength?: number,
  md5: string,
}

export interface PadplusRecalledMessagePayload {
  session: string,
  msgId: string,
  newMsgId: string,
  replaceMsg: string,
}

export interface PadplusVoiceMessagePayload {
  endFlag: number,
  length: number,
  voiceLength: number,
  clientMsgId: string,
  fromUsername: string,
  downCount: number,
  cancelFlag: number,
  voiceFormat: GrpcVoiceFormat,
  forwardFlag: number,
  bufId: number,
}

export interface PadplusLocationMessagePayload {
  x: number,
  y: number,
  scale: number,
  mapType: string,
  label: string,
  poiId: string,
  poiName: string,
  fromUsername: string,
}

export interface PadplusVideoMessagePayload {
  aesKey: string,
  cdnThumbAesKey: string,
  cdnVideoUrl: string,
  cdnThumbUrl: string,
  length: number,
  playLength: number,
  cdnThumbLength: number,
  cdnThumbWidth: number,
  cdnThumbHeight: number,
  fromUsername: string,
  md5: string,
  newMd5: string,
  isAd: boolean,
}

export interface PadplusUrlLink {
  description?  : string,
  thumbnailUrl? : string,
  title         : string,
  url           : string,
}

export interface PadplusMediaData {
  content: string,
  msgId: string,
  src: string,
  status: string,
  thumb: string,
}

export interface PadplusRecallData {
  BaseResponse: {
    Ret: number,
    ErrMsg: string,
  },
}
