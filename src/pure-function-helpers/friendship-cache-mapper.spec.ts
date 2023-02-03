#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { PuppetCacheFriendshipPayload } from 'wechaty-puppet-cache'

import { cacheToPadplusFriendshipPayload, padplusToCacheFriendshipPayload } from './friendship-cache-mapper'
import { payloads, types } from '@juzi/wechaty-puppet'

test('friendship-cache-mapper', async t => {
  const PADPLUS_FRIENDSHIP_PAYLOAD: payloads.Friendship = {
    contactId : 'contactId',
    hello     : 'hello',
    id        : 'id',
    scene     : types.FriendshipScene.Phone,
    stranger  : 'stranger',
    ticket    : 'ticket',
    timestamp : 1591069294176,
    type      : types.Friendship.Receive,
  }

  const EXPECTED_FRIENDSHIP_PAYLOAD: PuppetCacheFriendshipPayload = {
    contactId : 'contactId',
    hello     : 'hello',
    id        : 'id',
    scene     : types.FriendshipScene.Phone,
    stranger  : 'stranger',
    ticket    : 'ticket',
    timestamp : 1591069294176,
    type      : 2, // types.Friendship.Receive
  }

  const resultCache = padplusToCacheFriendshipPayload(PADPLUS_FRIENDSHIP_PAYLOAD)
  t.deepEqual(resultCache, EXPECTED_FRIENDSHIP_PAYLOAD, 'should parse FriendshipPayload for account payload')

  t.throws(() => padplusToCacheFriendshipPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheFriendshipPayload(undefined as any), 'should throw exception for undifined')

  const resultPadplus = cacheToPadplusFriendshipPayload(EXPECTED_FRIENDSHIP_PAYLOAD)
  t.deepEqual(resultPadplus, PADPLUS_FRIENDSHIP_PAYLOAD, 'should parse FriendshipPayload for account payload')

  t.throws(() => cacheToPadplusFriendshipPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusFriendshipPayload(undefined as any), 'should throw exception for undifined')
})
