import { WechatyCacheMessagePayload, WechatyCacheMessageType } from 'wechaty-cache'
import { PadplusMessagePayload, PadplusMessageType } from '../schemas'

export function cacheToPadplusMessagePayload (
  cachePayload: WechatyCacheMessagePayload,
): PadplusMessagePayload {
  if (!cachePayload.msgId) {
    throw Error('cannot get id from padplus payload: ' + JSON.stringify(cachePayload))
  }
  return {
    appMsgType                           : cachePayload.appMsgType,
    content                              : cachePayload.content,
    createTime                           : cachePayload.createTime,
    fileName                             : cachePayload.fileName,
    fromMemberNickName                   : cachePayload.fromMemberNickName,
    fromMemberUserName                   : cachePayload.fromMemberUserName,
    fromUserName                         : cachePayload.fromUserName,
    imgBuf                               : cachePayload.imgBuf,
    imgStatus                            : cachePayload.imgStatus,
    l1MsgType                            : cachePayload.l1MsgType,
    msgId                                : cachePayload.msgId,
    msgSource                            : cachePayload.msgSource,
    msgSourceCd                          : cachePayload.msgSourceCd,
    msgType                              : padplusMsgTypeMapper[cachePayload.msgType],
    newMsgId                             : cachePayload.newMsgId,
    pushContent                          : cachePayload.pushContent,
    status                               : cachePayload.status,
    toUserName                           : cachePayload.toUserName,
    uin                                  : cachePayload.uin,
    url                                  : cachePayload.url,
    wechatUserName                       : cachePayload.wechatUserName,
  } as PadplusMessagePayload
}

export function padplusToCacheMessagePayload (
  padplusPayload: PadplusMessagePayload,
): WechatyCacheMessagePayload {
  if (!padplusPayload.msgId) {
    throw Error('cannot get id from cache payload: ' + JSON.stringify(padplusPayload))
  }
  return {
    appMsgType                           : padplusPayload.appMsgType,
    atUserList                           : [],
    content                              : padplusPayload.content,
    createTime                           : padplusPayload.createTime,
    fileName                             : padplusPayload.fileName,
    fromMemberNickName                   : padplusPayload.fromMemberNickName,
    fromMemberUserName                   : padplusPayload.fromMemberUserName,
    fromUserName                         : padplusPayload.fromUserName,
    imgBuf                               : padplusPayload.imgBuf,
    imgStatus                            : padplusPayload.imgStatus,
    l1MsgType                            : padplusPayload.l1MsgType,
    msgId                                : padplusPayload.msgId,
    msgSource                            : padplusPayload.msgSource,
    msgSourceCd                          : padplusPayload.msgSourceCd,
    msgType                              : cacheMsgTypeMapper[padplusPayload.msgType],
    newMsgId                             : padplusPayload.newMsgId,
    path                                 : undefined,
    pushContent                          : padplusPayload.pushContent,
    status                               : padplusPayload.status,
    thumbPath                            : undefined,
    toUserName                           : padplusPayload.toUserName,
    uin                                  : padplusPayload.uin,
    url                                  : padplusPayload.url,
    wechatUserName                       : padplusPayload.wechatUserName,
  } as WechatyCacheMessagePayload
}

const padplusMsgTypeMapper: { [cacheMsgType: number]: number } = {}
padplusMsgTypeMapper[WechatyCacheMessageType.App]                = PadplusMessageType.App
padplusMsgTypeMapper[WechatyCacheMessageType.Text]               = PadplusMessageType.Text
padplusMsgTypeMapper[WechatyCacheMessageType.Contact]            = PadplusMessageType.Contact
padplusMsgTypeMapper[WechatyCacheMessageType.Image]              = PadplusMessageType.Image
padplusMsgTypeMapper[WechatyCacheMessageType.Deleted]            = PadplusMessageType.Deleted
padplusMsgTypeMapper[WechatyCacheMessageType.Voice]              = PadplusMessageType.Voice
padplusMsgTypeMapper[WechatyCacheMessageType.SelfAvatar]         = PadplusMessageType.SelfAvatar
padplusMsgTypeMapper[WechatyCacheMessageType.VerifyMsg]          = PadplusMessageType.VerifyMsg
padplusMsgTypeMapper[WechatyCacheMessageType.PossibleFriendMsg]  = PadplusMessageType.PossibleFriendMsg
padplusMsgTypeMapper[WechatyCacheMessageType.ShareCard]          = PadplusMessageType.ShareCard
padplusMsgTypeMapper[WechatyCacheMessageType.Video]              = PadplusMessageType.Video
padplusMsgTypeMapper[WechatyCacheMessageType.Emoticon]           = PadplusMessageType.Emoticon
padplusMsgTypeMapper[WechatyCacheMessageType.Location]           = PadplusMessageType.Location
padplusMsgTypeMapper[WechatyCacheMessageType.VoipMsg]            = PadplusMessageType.VoipMsg
padplusMsgTypeMapper[WechatyCacheMessageType.StatusNotify]       = PadplusMessageType.StatusNotify
padplusMsgTypeMapper[WechatyCacheMessageType.VoipNotify]         = PadplusMessageType.VoipNotify
padplusMsgTypeMapper[WechatyCacheMessageType.VoipInvite]         = PadplusMessageType.VoipInvite
padplusMsgTypeMapper[WechatyCacheMessageType.MicroVideo]         = PadplusMessageType.MicroVideo
padplusMsgTypeMapper[WechatyCacheMessageType.SelfInfo]           = PadplusMessageType.SelfInfo
padplusMsgTypeMapper[WechatyCacheMessageType.SysNotice]          = PadplusMessageType.SysNotice
padplusMsgTypeMapper[WechatyCacheMessageType.Sys]                = PadplusMessageType.Sys
padplusMsgTypeMapper[WechatyCacheMessageType.Recalled]           = PadplusMessageType.Recalled
padplusMsgTypeMapper[WechatyCacheMessageType.N11_2048]           = PadplusMessageType.N11_2048
padplusMsgTypeMapper[WechatyCacheMessageType.N15_32768]          = PadplusMessageType.N15_32768

const cacheMsgTypeMapper: { [cacheMsgType: number]: number } = {}
cacheMsgTypeMapper[PadplusMessageType.App]                = WechatyCacheMessageType.App
cacheMsgTypeMapper[PadplusMessageType.Text]               = WechatyCacheMessageType.Text
cacheMsgTypeMapper[PadplusMessageType.Contact]            = WechatyCacheMessageType.Contact
cacheMsgTypeMapper[PadplusMessageType.Image]              = WechatyCacheMessageType.Image
cacheMsgTypeMapper[PadplusMessageType.Deleted]            = WechatyCacheMessageType.Deleted
cacheMsgTypeMapper[PadplusMessageType.Voice]              = WechatyCacheMessageType.Voice
cacheMsgTypeMapper[PadplusMessageType.SelfAvatar]         = WechatyCacheMessageType.SelfAvatar
cacheMsgTypeMapper[PadplusMessageType.VerifyMsg]          = WechatyCacheMessageType.VerifyMsg
cacheMsgTypeMapper[PadplusMessageType.PossibleFriendMsg]  = WechatyCacheMessageType.PossibleFriendMsg
cacheMsgTypeMapper[PadplusMessageType.ShareCard]          = WechatyCacheMessageType.ShareCard
cacheMsgTypeMapper[PadplusMessageType.Video]              = WechatyCacheMessageType.Video
cacheMsgTypeMapper[PadplusMessageType.Emoticon]           = WechatyCacheMessageType.Emoticon
cacheMsgTypeMapper[PadplusMessageType.Location]           = WechatyCacheMessageType.Location
cacheMsgTypeMapper[PadplusMessageType.VoipMsg]            = WechatyCacheMessageType.VoipMsg
cacheMsgTypeMapper[PadplusMessageType.StatusNotify]       = WechatyCacheMessageType.StatusNotify
cacheMsgTypeMapper[PadplusMessageType.VoipNotify]         = WechatyCacheMessageType.VoipNotify
cacheMsgTypeMapper[PadplusMessageType.VoipInvite]         = WechatyCacheMessageType.VoipInvite
cacheMsgTypeMapper[PadplusMessageType.MicroVideo]         = WechatyCacheMessageType.MicroVideo
cacheMsgTypeMapper[PadplusMessageType.SelfInfo]           = WechatyCacheMessageType.SelfInfo
cacheMsgTypeMapper[PadplusMessageType.SysNotice]          = WechatyCacheMessageType.SysNotice
cacheMsgTypeMapper[PadplusMessageType.Sys]                = WechatyCacheMessageType.Sys
cacheMsgTypeMapper[PadplusMessageType.Recalled]           = WechatyCacheMessageType.Recalled
cacheMsgTypeMapper[PadplusMessageType.N11_2048]           = WechatyCacheMessageType.N11_2048
cacheMsgTypeMapper[PadplusMessageType.N15_32768]          = WechatyCacheMessageType.N15_32768
