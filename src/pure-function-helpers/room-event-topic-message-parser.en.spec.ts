#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  PuppetRoomTopicEvent,
  YOU,
}                               from 'wechaty-puppet'

import {
  PadplusMessagePayload,
}                               from '../schemas'

import { roomTopicEventMessageParser }  from './room-event-topic-message-parser'

test('roomTopicEventMessageParser() EN-other-modify-topic', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '"高原ོ"修改群名为“未命名”',
    createTime: 1568208243261,
    fromUserName: '18295482296@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '4392351666543040436',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10000,
    newMsgId: 4392351666543040500,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_EVENT: PuppetRoomTopicEvent = {
    changerName: '高原ོ',
    roomId: '18295482296@chatroom',
    timestamp: 1568208243261,
    topic: '未命名',
  }

  const event = roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomTopicEventMessageParser() EN-bot-modify-topic', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '你修改群名为“命名了”',
    createTime: 1568208437265,
    fromUserName: '18295482296@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '3567919101394598675',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10000,
    newMsgId: 3567919101394599000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_EVENT: PuppetRoomTopicEvent = {
    changerName: YOU,
    roomId: '18295482296@chatroom',
    timestamp: 1568208437265,
    topic: '命名了',
  }

  const event = roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})
