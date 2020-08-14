import { PuppetCacheMessagePayload, PuppetCacheMessageType } from 'wechaty-puppet-cache'
import { PadplusMessagePayload, PadplusMessageType } from '../schemas'

export function cacheToPadplusMessagePayload (
  cachePayload: PuppetCacheMessagePayload,
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
): PuppetCacheMessagePayload {
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
  } as PuppetCacheMessagePayload
}

const padplusMsgTypeMapper: { [cacheMsgType: number]: number } = {}
padplusMsgTypeMapper[PuppetCacheMessageType.App]                = PadplusMessageType.App
padplusMsgTypeMapper[PuppetCacheMessageType.Text]               = PadplusMessageType.Text
padplusMsgTypeMapper[PuppetCacheMessageType.Contact]            = PadplusMessageType.Contact
padplusMsgTypeMapper[PuppetCacheMessageType.Image]              = PadplusMessageType.Image
padplusMsgTypeMapper[PuppetCacheMessageType.Deleted]            = PadplusMessageType.Deleted
padplusMsgTypeMapper[PuppetCacheMessageType.Voice]              = PadplusMessageType.Voice
padplusMsgTypeMapper[PuppetCacheMessageType.SelfAvatar]         = PadplusMessageType.SelfAvatar
padplusMsgTypeMapper[PuppetCacheMessageType.VerifyMsg]          = PadplusMessageType.VerifyMsg
padplusMsgTypeMapper[PuppetCacheMessageType.PossibleFriendMsg]  = PadplusMessageType.PossibleFriendMsg
padplusMsgTypeMapper[PuppetCacheMessageType.ShareCard]          = PadplusMessageType.ShareCard
padplusMsgTypeMapper[PuppetCacheMessageType.Video]              = PadplusMessageType.Video
padplusMsgTypeMapper[PuppetCacheMessageType.Emoticon]           = PadplusMessageType.Emoticon
padplusMsgTypeMapper[PuppetCacheMessageType.Location]           = PadplusMessageType.Location
padplusMsgTypeMapper[PuppetCacheMessageType.VoipMsg]            = PadplusMessageType.VoipMsg
padplusMsgTypeMapper[PuppetCacheMessageType.StatusNotify]       = PadplusMessageType.StatusNotify
padplusMsgTypeMapper[PuppetCacheMessageType.VoipNotify]         = PadplusMessageType.VoipNotify
padplusMsgTypeMapper[PuppetCacheMessageType.VoipInvite]         = PadplusMessageType.VoipInvite
padplusMsgTypeMapper[PuppetCacheMessageType.MicroVideo]         = PadplusMessageType.MicroVideo
padplusMsgTypeMapper[PuppetCacheMessageType.SelfInfo]           = PadplusMessageType.SelfInfo
padplusMsgTypeMapper[PuppetCacheMessageType.SysNotice]          = PadplusMessageType.SysNotice
padplusMsgTypeMapper[PuppetCacheMessageType.Sys]                = PadplusMessageType.Sys
padplusMsgTypeMapper[PuppetCacheMessageType.Recalled]           = PadplusMessageType.Recalled
padplusMsgTypeMapper[PuppetCacheMessageType.N11_2048]           = PadplusMessageType.N11_2048
padplusMsgTypeMapper[PuppetCacheMessageType.N15_32768]          = PadplusMessageType.N15_32768

const cacheMsgTypeMapper: { [cacheMsgType: number]: number } = {}
cacheMsgTypeMapper[PadplusMessageType.App]                = PuppetCacheMessageType.App
cacheMsgTypeMapper[PadplusMessageType.Text]               = PuppetCacheMessageType.Text
cacheMsgTypeMapper[PadplusMessageType.Contact]            = PuppetCacheMessageType.Contact
cacheMsgTypeMapper[PadplusMessageType.Image]              = PuppetCacheMessageType.Image
cacheMsgTypeMapper[PadplusMessageType.Deleted]            = PuppetCacheMessageType.Deleted
cacheMsgTypeMapper[PadplusMessageType.Voice]              = PuppetCacheMessageType.Voice
cacheMsgTypeMapper[PadplusMessageType.SelfAvatar]         = PuppetCacheMessageType.SelfAvatar
cacheMsgTypeMapper[PadplusMessageType.VerifyMsg]          = PuppetCacheMessageType.VerifyMsg
cacheMsgTypeMapper[PadplusMessageType.PossibleFriendMsg]  = PuppetCacheMessageType.PossibleFriendMsg
cacheMsgTypeMapper[PadplusMessageType.ShareCard]          = PuppetCacheMessageType.ShareCard
cacheMsgTypeMapper[PadplusMessageType.Video]              = PuppetCacheMessageType.Video
cacheMsgTypeMapper[PadplusMessageType.Emoticon]           = PuppetCacheMessageType.Emoticon
cacheMsgTypeMapper[PadplusMessageType.Location]           = PuppetCacheMessageType.Location
cacheMsgTypeMapper[PadplusMessageType.VoipMsg]            = PuppetCacheMessageType.VoipMsg
cacheMsgTypeMapper[PadplusMessageType.StatusNotify]       = PuppetCacheMessageType.StatusNotify
cacheMsgTypeMapper[PadplusMessageType.VoipNotify]         = PuppetCacheMessageType.VoipNotify
cacheMsgTypeMapper[PadplusMessageType.VoipInvite]         = PuppetCacheMessageType.VoipInvite
cacheMsgTypeMapper[PadplusMessageType.MicroVideo]         = PuppetCacheMessageType.MicroVideo
cacheMsgTypeMapper[PadplusMessageType.SelfInfo]           = PuppetCacheMessageType.SelfInfo
cacheMsgTypeMapper[PadplusMessageType.SysNotice]          = PuppetCacheMessageType.SysNotice
cacheMsgTypeMapper[PadplusMessageType.Sys]                = PuppetCacheMessageType.Sys
cacheMsgTypeMapper[PadplusMessageType.Recalled]           = PuppetCacheMessageType.Recalled
cacheMsgTypeMapper[PadplusMessageType.N11_2048]           = PuppetCacheMessageType.N11_2048
cacheMsgTypeMapper[PadplusMessageType.N15_32768]          = PuppetCacheMessageType.N15_32768
