#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { WechatyCacheFriendshipPayload } from 'wechaty-cache'
import { FriendshipPayload } from '../schemas'

import { cacheToPadplusFriendshipPayload, padplusToCacheFriendshipPayload } from './friendship-cache-mapper'
import { FriendshipType } from 'wechaty-puppet'

test('friendship-cache-mapper', async t => {
  const PADPLUS_FRIENDSHIP_PAYLOAD: FriendshipPayload = {
    contactId : 'contactId',
    hello     : 'hello',
    id        : 'id',
    stranger  : 'stranger',
    ticket    : 'ticket',
    timestamp : 1591069294176,
    type      : FriendshipType.Receive,
  }

  const EXPECTED_FRIENDSHIP_PAYLOAD: WechatyCacheFriendshipPayload = {
    contactId : 'contactId',
    hello     : 'hello',
    id        : 'id',
    scene     : undefined,
    stranger  : 'stranger',
    ticket    : 'ticket',
    timestamp : 1591069294176,
    type      : FriendshipType.Receive,
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
