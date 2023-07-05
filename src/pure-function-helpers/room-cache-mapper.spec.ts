#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { PuppetCacheRoomPayload } from '@juzi/wechaty-puppet-cache'
import { PadplusRoomPayload } from '../schemas'

import { cacheToPadplusRoomPayload, padplusToCacheRoomPayload } from './room-cache-mapper'

test('room-cache-mapper', async t => {
  const PADPLUS_ROOM_PAYLOAD: PadplusRoomPayload = {
    alias          : 'alias',
    bigHeadUrl     : 'bigHeadUrl',
    chatRoomOwner  : 'chatRoomOwner',
    chatroomId     : 'chatroomId',
    chatroomVersion: 1,
    contactType    : 2,
    memberCount    : 3,
    members        : [{
      nickName              : 'nickName',
      userName              : 'userName',
    }, {
      nickName              : 'nickName',
      userName              : 'userName',
    }, {
      nickName              : 'nickName',
      userName              : 'userName',
    }],
    nickName       : 'nickName',
    smallHeadUrl   : 'smallHeadUrl',
    stranger       : 'stranger',
    tagList        : 'tagList',
    ticket         : 'ticket',
  }

  const EXPECTED_ROOM_PAYLOAD: PuppetCacheRoomPayload = {
    alias          : 'alias',
    bigHeadUrl     : 'bigHeadUrl',
    chatRoomOwner  : 'chatRoomOwner',
    chatroomId     : 'chatroomId',
    chatroomVersion: 1,
    contactType    : 2,
    isManager      : undefined,
    memberCount    : 3,
    members        : [{
      avatar                : undefined,
      inviteBy              : undefined,
      nickName              : 'nickName',
      userName              : 'userName',
    }, {
      avatar                : undefined,
      inviteBy              : undefined,
      nickName              : 'nickName',
      userName              : 'userName',
    }, {
      avatar                : undefined,
      inviteBy              : undefined,
      nickName              : 'nickName',
      userName              : 'userName',
    }],
    nickName       : 'nickName',
    smallHeadUrl   : 'smallHeadUrl',
    stranger       : 'stranger',
    tagList        : 'tagList',
    ticket         : 'ticket',
  }

  const resultCache = padplusToCacheRoomPayload(PADPLUS_ROOM_PAYLOAD)
  t.deepEqual(resultCache, EXPECTED_ROOM_PAYLOAD, 'should parse RoomPayload for account payload')

  t.throws(() => padplusToCacheRoomPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheRoomPayload(undefined as any), 'should throw exception for undifined')

  const resultPadplus = cacheToPadplusRoomPayload(EXPECTED_ROOM_PAYLOAD)
  t.deepEqual(resultPadplus, PADPLUS_ROOM_PAYLOAD, 'should parse RoomPayload for account payload')

  t.throws(() => cacheToPadplusRoomPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusRoomPayload(undefined as any), 'should throw exception for undifined')
})
