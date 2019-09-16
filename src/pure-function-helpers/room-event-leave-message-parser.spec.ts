#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'
import { YOU } from 'wechaty-puppet'

import {
  PadplusMessagePayload,
}                                 from '../schemas'

import {
  roomLeaveEventMessageParser,
}                               from './room-event-leave-message-parser'

test('roomLeaveEventMessageParser() not detected', async t => {
  t.equal(
    await roomLeaveEventMessageParser(undefined as any),
    null,
    'should return null for undefined',
  )

  t.equal(
    await roomLeaveEventMessageParser('null' as any),
    null,
    'should return null for null',
  )

  t.equal(
    await roomLeaveEventMessageParser('test' as any),
    null,
    'should return null for string',
  )

  t.equal(
    await roomLeaveEventMessageParser({} as any),
    null,
    'should return null for empty object',
  )

  t.equal(
    await roomLeaveEventMessageParser({ content: 'fsdfsfsdfasfas' } as PadplusMessagePayload),
    null,
    'should return null for PadplusMessagePayload with unknown content',
  )

})

test('roomLeaveEventMessageParser() Recall Message', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: 'qq512436430: \n<sysmsg type = "revokemsg"><revokemsg><session>5367653125@chatroom</session><msgid>1452102025</msgid><newmsgid>2582549652250718552</newmsgid><replacemsg><![CDATA["李佳芮" has recalled a message.]]></replacemsg></revokemsg></sysmsg>',
    createTime: 1528806181,
    fromUserName: '5367653125@chatroom',
    imgStatus: 0,
    l1MsgType: 0,
    msgId: '8079407148816751084',
    msgSource: '',
    msgSourceCd: 0,
    msgType: 10002,
    newMsgId: 8079407148816751084,
    pushContent: '',
    status: 1,
    toUserName: 'wxid_5zj4i5htp9ih22',
    uin: '0',
    wechatUserName: '',
  }
  t.equal(await roomLeaveEventMessageParser(MESSAGE_PAYLOAD), null, 'should return null for a normal message recall payload')
})

test('roomLeaveEventMessageParser() Recall Message', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '你将"我爱抓娃娃-抓抓抓抓抓抓抓抓"移出了群聊',
    createTime: 1568207019121,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: '18972581662@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '6472140441172687372',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10000,
    newMsgId: 6472140441172688000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }
  const actual = {
    leaverNameList: [ '我爱抓娃娃-抓抓抓抓抓抓抓抓' ],
    removerName: YOU,
    roomId: '18972581662@chatroom',
    timestamp: 1568207019121,
  }
  t.deepEqual(await roomLeaveEventMessageParser(MESSAGE_PAYLOAD), actual, 'should return actual data')
})
