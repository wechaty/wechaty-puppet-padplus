import { PuppetCacheRoomPayload, PuppetMemberBrief } from 'wechaty-puppet-cache'
import { PadplusRoomPayload, PadplusMemberBrief } from '../schemas'

export function cacheToPadplusRoomPayload (
  cachePayload: PuppetCacheRoomPayload,
): PadplusRoomPayload {
  if (!cachePayload.chatroomId) {
    throw Error('cannot get chatroomId from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    alias                     : cachePayload.alias,
    bigHeadUrl                : cachePayload.bigHeadUrl,
    chatRoomOwner             : cachePayload.chatRoomOwner,
    chatroomId                : cachePayload.chatroomId,
    chatroomVersion           : cachePayload.chatroomVersion,
    contactType               : cachePayload.contactType,
    memberCount               : cachePayload.memberCount,
    members                   : cachePayload.members.map(m => { return cacheToPadplusMemberBriefPayload(m) }),
    nickName                  : cachePayload.nickName,
    smallHeadUrl              : cachePayload.smallHeadUrl,
    stranger                  : cachePayload.stranger,
    tagList                   : cachePayload.tagList,
    ticket                    : cachePayload.ticket,
  } as PadplusRoomPayload
}

export function padplusToCacheRoomPayload (
  padplusPayload: PadplusRoomPayload,
): PuppetCacheRoomPayload {
  if (!padplusPayload.chatroomId) {
    throw Error('cannot get chatroomId from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  return {
    alias                     : padplusPayload.alias,
    bigHeadUrl                : padplusPayload.bigHeadUrl,
    chatRoomOwner             : padplusPayload.chatRoomOwner,
    chatroomId                : padplusPayload.chatroomId,
    chatroomVersion           : padplusPayload.chatroomVersion,
    contactType               : padplusPayload.contactType,
    isManager                 : undefined,
    memberCount               : padplusPayload.memberCount,
    members                   : padplusPayload.members.map(m => { return padplusToCacheMemberBriefPayload(m) }),
    nickName                  : padplusPayload.nickName,
    smallHeadUrl              : padplusPayload.smallHeadUrl,
    stranger                  : padplusPayload.stranger,
    tagList                   : padplusPayload.tagList,
    ticket                    : padplusPayload.ticket,
  } as PuppetCacheRoomPayload
}

export function cacheToPadplusMemberBriefPayload (
  cachePayload: PuppetMemberBrief,
): PadplusMemberBrief {
  if (!cachePayload.userName) {
    throw Error('cannot get userName from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    NickName                   : cachePayload.nickName,
    UserName                   : cachePayload.userName,
  } as PadplusMemberBrief
}

export function padplusToCacheMemberBriefPayload (
  padplusPayload: PadplusMemberBrief,
): PuppetMemberBrief {
  if (!padplusPayload.UserName) {
    throw Error('cannot get UserName from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  return {
    avatar                     : undefined,
    inviteBy                   : undefined,
    nickName                   : padplusPayload.NickName,
    userName                   : padplusPayload.UserName,
  } as PuppetMemberBrief
}
