#!/usr/bin/env ts-node

/* eslint-disable */
// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'
import { types } from '@juzi/wechaty-puppet'

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

test('roomLeaveEventMessageParser() bot kick out other', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '25044049015@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[You removed \"$kickoutname$\" from the group chat]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"kickoutname\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[Soul001001]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[苏畅]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
    createTime: 1597032764085,
    fromMemberUserName: '25044049015@chatroom',
    fromUserName: '25044049015@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '1921720239587556760',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 1921720239587556900,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_orp7dihe2pm112',
    uin: '289099750',
    wechatUserName: 'wxid_orp7dihe2pm112',
  }

  const actual = {
    leaverIdList: [ 'Soul001001' ],
    removerId: types.YOU,
    roomId: '25044049015@chatroom',
    timestamp: 1597032764085,
  }

  t.deepEqual(await roomLeaveEventMessageParser(MESSAGE_PAYLOAD), actual, 'should return actual data')
})
