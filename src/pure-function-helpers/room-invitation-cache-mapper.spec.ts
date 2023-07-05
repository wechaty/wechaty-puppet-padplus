#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { PuppetCacheRoomInvitationPayload } from '@juzi/wechaty-puppet-cache'
import { PadplusRoomInvitationPayload } from '../schemas'

import { cacheToPadplusRoomInvitationPayload, padplusToCacheRoomInvitationPayload } from './room-invitation-cache-mapper'

test('room-invitation-cache-mapper', async t => {
  const PADPLUS_ROOM_INVITATION_PAYLOAD: PadplusRoomInvitationPayload = {
    fromUser               : 'fromUser',
    id                     : 'id',
    receiver               : 'receiver',
    roomName               : 'roomName',
    thumbUrl               : 'thumbUrl',
    timestamp              : 1591079003167,
    url                    : 'url',
  }

  const EXPECTED_ROOM_INVITATION_PAYLOAD: PuppetCacheRoomInvitationPayload = {
    fromUser               : 'fromUser',
    id                     : 'id',
    receiver               : 'receiver',
    roomName               : 'roomName',
    thumbUrl               : 'thumbUrl',
    timestamp              : 1591079003167,
    url                    : 'url',
  }

  const resultCache = padplusToCacheRoomInvitationPayload(PADPLUS_ROOM_INVITATION_PAYLOAD)
  t.deepEqual(resultCache, EXPECTED_ROOM_INVITATION_PAYLOAD, 'should parse RoomInvitationPayload for account payload')

  t.throws(() => padplusToCacheRoomInvitationPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheRoomInvitationPayload(undefined as any), 'should throw exception for undifined')

  const resultPadplus = cacheToPadplusRoomInvitationPayload(EXPECTED_ROOM_INVITATION_PAYLOAD)
  t.deepEqual(resultPadplus, PADPLUS_ROOM_INVITATION_PAYLOAD, 'should parse RoomInvitationPayload for account payload')

  t.throws(() => cacheToPadplusRoomInvitationPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusRoomInvitationPayload(undefined as any), 'should throw exception for undifined')
})
