import { PuppetCacheFriendshipPayload } from '@juzi/wechaty-puppet-cache'
import { payloads, types } from '@juzi/wechaty-puppet'

export function cacheToPadplusFriendshipPayload (
  cachePayload: PuppetCacheFriendshipPayload,
): payloads.Friendship {
  if (!cachePayload.id) {
    throw Error('cannot get id from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    contactId : cachePayload.contactId,
    hello     : cachePayload.hello,
    id        : cachePayload.id,
    scene     : cachePayload.scene,
    stranger  : cachePayload.stranger,
    ticket    : cachePayload.ticket,
    timestamp : cachePayload.timestamp,
    type      : cachePayload.type,
  } as payloads.Friendship
}

export function padplusToCacheFriendshipPayload (
  padplusPayload: payloads.Friendship,
): PuppetCacheFriendshipPayload {
  if (!padplusPayload.id) {
    throw Error('cannot get id from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  switch (padplusPayload.type) {
    case types.Friendship.Confirm:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        timestamp : padplusPayload.timestamp,
        type      : types.Friendship.Confirm,
      } as PuppetCacheFriendshipPayload
    case types.Friendship.Receive:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        scene     : padplusPayload.scene,
        stranger  : padplusPayload.stranger,
        ticket    : padplusPayload.ticket,
        timestamp : padplusPayload.timestamp,
        type      : types.Friendship.Receive,
      } as PuppetCacheFriendshipPayload
    case types.Friendship.Verify:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        timestamp : padplusPayload.timestamp,
        type      : types.Friendship.Verify,
      } as PuppetCacheFriendshipPayload
    default:
      throw new Error(`unknown friendship type.`)
  }
}
