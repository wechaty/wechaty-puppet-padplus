import { PuppetCacheFriendshipPayload } from 'wechaty-puppet-cache'
import { FriendshipPayload } from '../schemas'
import { FriendshipType } from 'wechaty-puppet'

export function cacheToPadplusFriendshipPayload (
  cachePayload: PuppetCacheFriendshipPayload,
): FriendshipPayload {
  if (!cachePayload.id) {
    throw Error('cannot get id from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    contactId : cachePayload.contactId,
    hello     : cachePayload.hello,
    id        : cachePayload.id,
    stranger  : cachePayload.stranger,
    ticket    : cachePayload.ticket,
    timestamp : cachePayload.timestamp,
    type      : cachePayload.type,
  } as FriendshipPayload
}

export function padplusToCacheFriendshipPayload (
  padplusPayload: FriendshipPayload,
): PuppetCacheFriendshipPayload {
  if (!padplusPayload.id) {
    throw Error('cannot get id from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  switch (padplusPayload.type) {
    case FriendshipType.Confirm:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        timestamp : padplusPayload.timestamp,
      } as PuppetCacheFriendshipPayload
    case FriendshipType.Receive:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        scene     : undefined,
        stranger  : padplusPayload.stranger,
        ticket    : padplusPayload.ticket,
        timestamp : padplusPayload.timestamp,
        type      : FriendshipType.Receive,
      } as PuppetCacheFriendshipPayload
    case FriendshipType.Verify:
      return {
        contactId : padplusPayload.contactId,
        hello     : padplusPayload.hello,
        id        : padplusPayload.id,
        timestamp : padplusPayload.timestamp,
      } as PuppetCacheFriendshipPayload
  }
  throw new Error(`unknown friendship type.`)
}
