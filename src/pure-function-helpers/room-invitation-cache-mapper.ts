import { PuppetCacheRoomInvitationPayload } from '@juzi/wechaty-puppet-cache'
import { PadplusRoomInvitationPayload } from '../schemas'

export function cacheToPadplusRoomInvitationPayload (
  cachePayload: PuppetCacheRoomInvitationPayload,
): PadplusRoomInvitationPayload {
  if (!cachePayload.id) {
    throw Error('cannot get id from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    fromUser : cachePayload.fromUser,
    id       : cachePayload.id,
    receiver : cachePayload.receiver,
    roomName : cachePayload.roomName,
    thumbUrl : cachePayload.thumbUrl,
    timestamp: cachePayload.timestamp,
    url      : cachePayload.url,
  } as PadplusRoomInvitationPayload
}

export function padplusToCacheRoomInvitationPayload (
  padplusPayload: PadplusRoomInvitationPayload,
): PuppetCacheRoomInvitationPayload {
  if (!padplusPayload.id) {
    throw Error('cannot get id from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  return {
    fromUser : padplusPayload.fromUser,
    id       : padplusPayload.id,
    receiver : padplusPayload.receiver,
    roomName : padplusPayload.roomName,
    thumbUrl : padplusPayload.thumbUrl,
    timestamp: padplusPayload.timestamp,
    url      : padplusPayload.url,
  } as PuppetCacheRoomInvitationPayload
}
