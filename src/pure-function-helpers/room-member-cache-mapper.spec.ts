#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { PuppetCacheRoomMemberPayload } from 'wechaty-puppet-cache'
import { PadplusRoomMemberPayload } from '../schemas'

import { cacheToPadplusRoomMemberPayload, padplusToCacheRoomMemberPayload } from './room-member-cache-mapper'

test('room-member-cache-mapper.spec', async t => {
  const PADPLUS_ROOM_MEMBER_PAYLOAD: PadplusRoomMemberPayload = {
    bigHeadUrl             : 'bigHeadUrl',
    contactId              : 'contactId',
    displayName            : 'displayName',
    inviterId              : 'inviterId',
    nickName               : 'nickName',
    smallHeadUrl           : 'smallHeadUrl',
  }

  const EXPECTED_ROOM_MEMBER_PAYLOAD: PuppetCacheRoomMemberPayload = {
    account                : undefined,
    bigHeadUrl             : 'bigHeadUrl',
    contactId              : 'contactId',
    displayName            : 'displayName',
    inviterId              : 'inviterId',
    nickName               : 'nickName',
    sex                    : 0,
    smallHeadUrl           : 'smallHeadUrl',
  }

  const resultCache = padplusToCacheRoomMemberPayload(PADPLUS_ROOM_MEMBER_PAYLOAD)
  t.deepEqual(resultCache, EXPECTED_ROOM_MEMBER_PAYLOAD, 'should parse RoomMemberPayload for account payload')

  t.throws(() => padplusToCacheRoomMemberPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheRoomMemberPayload(undefined as any), 'should throw exception for undifined')

  const resultPadplus = cacheToPadplusRoomMemberPayload(EXPECTED_ROOM_MEMBER_PAYLOAD)
  t.deepEqual(resultPadplus, PADPLUS_ROOM_MEMBER_PAYLOAD, 'should parse RoomMemberPayload for account payload')

  t.throws(() => cacheToPadplusRoomMemberPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusRoomMemberPayload(undefined as any), 'should throw exception for undifined')
})
