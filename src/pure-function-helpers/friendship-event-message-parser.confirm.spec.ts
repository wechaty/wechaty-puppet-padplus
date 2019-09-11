#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  PadplusMessagePayload,
}                             from '../schemas'

import { friendshipConfirmEventMessageParser } from './friendship-event-message-parser'
/*
test('friendshipConfirmEventMessageParser() EN-confirm-by-other', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content      : `I've accepted your friend request. Now let's chat!`,
    fromUser     : 'wxid_a8d806dzznm822',
    messageId    : '7195763643366256289',
    messageSource: '',
    messageType  : 1,
    status       : 1,
    timestamp    : 1528787010,
    toUser       : 'wxid_5zj4i5htp9ih22',
  }

  const EXPECTED_CONTACT_ID = 'wxid_a8d806dzznm822'

  const contactName = friendshipConfirmEventMessageParser(MESSAGE_PAYLOAD)
  t.equal(contactName, EXPECTED_CONTACT_ID, 'should parse message to contact id')
}) */
/*
test('friendshipConfirmEventMessageParser() EN-confirm-by-bot', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content      : 'You have added 李卓桓 as your WeChat contact. Start chatting!',
    fromUser     : 'lizhuohuan',
    messageId    : '4530350877549544428',
    messageSource: '',
    messageType  : 10000,
    status       : 1,
    timestamp    : 1528786605,
    toUser       : 'wxid_5zj4i5htp9ih22',
  }
  const EXPECTED_CONTACT_ID = 'lizhuohuan'

  const contactName = friendshipConfirmEventMessageParser(MESSAGE_PAYLOAD)
  t.equal(contactName, EXPECTED_CONTACT_ID, 'should parse message to contact id')
}) */

test('friendshipConfirmEventMessageParser() ZH-confirm-by-other', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '我通过了你的朋友验证请求，现在我们可以开始聊天了',
    createTime: 1568208644138,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'Soul001001',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '4416867085807044016',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 1,
    newMsgId: 4416867085807044000,
    pushContent: '',
    status: 3,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }

  const EXPECTED_CONTACT_ID = 'Soul001001'
  const contactName = friendshipConfirmEventMessageParser(MESSAGE_PAYLOAD)
  t.equal(contactName, EXPECTED_CONTACT_ID, 'should parse message to contact id')
})

test('friendshipConfirmEventMessageParser() ZH-confirm-by-bot', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '你已添加了苏畅👾，现在可以开始聊天了。',
    createTime: 1568208280133,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'Soul001001',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '6593774828336014301',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10000,
    newMsgId: 6593774828336014000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }
  const EXPECTED_CONTACT_ID = 'Soul001001'

  const contactName = friendshipConfirmEventMessageParser(MESSAGE_PAYLOAD)
  t.equal(contactName, EXPECTED_CONTACT_ID, 'should parse message to contact id')
})
