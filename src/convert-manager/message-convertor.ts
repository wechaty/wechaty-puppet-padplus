import { PadplusMessagePayload } from '../schemas/model-message'

import {
  PadplusMessageType,
  GrpcMessagePayload,
} from '../schemas'

export async function convertMessageFromGrpcToPadplus (rawMessage: GrpcMessagePayload): Promise<PadplusMessagePayload> {
  const messagePayload: PadplusMessagePayload = {
    appMsgType: rawMessage.AppMsgType,
    content: rawMessage.Content,
    createTime: rawMessage.CreateTime,
    fileName: rawMessage.FileName || rawMessage.fileName,
    fromMemberNickName: rawMessage.FromMemberNickName,
    fromMemberUserName: rawMessage.FromMemberUserName,
    fromUserName: rawMessage.FromUserName,
    imgBuf: rawMessage.ImgBuf,
    imgStatus: rawMessage.ImgStatus,
    l1MsgType: rawMessage.L1MsgType,
    msgId: rawMessage.MsgId,
    msgSource: rawMessage.MsgSource,
    msgSourceCd: rawMessage.msgSourceCd,
    msgType: rawMessage.MsgType as PadplusMessageType,
    newMsgId: rawMessage.NewMsgId,
    pushContent: rawMessage.PushContent,
    status: rawMessage.Status,
    toUserName: rawMessage.ToUserName,
    uin: rawMessage.Uin,
    url: rawMessage.Url,
    wechatUserName: rawMessage.wechatUserName,
  }
  return messagePayload
}
