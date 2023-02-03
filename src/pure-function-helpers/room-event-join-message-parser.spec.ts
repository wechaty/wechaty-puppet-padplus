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
  roomJoinEventMessageParser,
}                               from './room-event-join-message-parser'

test('roomJoinEventMessageParser() not detected', async t => {
  t.equal(
    await roomJoinEventMessageParser(undefined as any),
    null,
    'should return null for undefined',
  )

  t.equal(
    await roomJoinEventMessageParser('null' as any),
    null,
    'should return null for null',
  )

  t.equal(
    await roomJoinEventMessageParser('test' as any),
    null,
    'should return null for string',
  )

  t.equal(
    await roomJoinEventMessageParser({} as any),
    null,
    'should return null for empty object',
  )

  t.equal(
    await roomJoinEventMessageParser({ content: 'fsdfsfsdfasfas' } as PadplusMessagePayload),
    null,
    'should return null for PadplusMessagePayload with unknown content',
  )

})

test('roomJoinEventMessageParser() bot invite other', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profilewithrevoke\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[你邀请\"$names$\"加入了群聊  $revoke$]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"names\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_3s4v7osfgpbc22]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[柠檬不酸]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t\t<separator><![CDATA[、]]></separator>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"revoke\" type=\"link_revoke\" hidden=\"1\">\n\t\t\t\t\t<title><![CDATA[撤销]]></title>\n\t\t\t\t\t<usernamelist>\n\t\t\t\t\t\t<username><![CDATA[wxid_3s4v7osfgpbc22]]></username>\n\t\t\t\t\t</usernamelist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
    createTime: 1595916797061,
    fromMemberUserName: '20434481305@chatroom',
    fromUserName: '20434481305@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '7816589581642576688',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 7816589581642577000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_orp7dihe2pm112',
    uin: '289099750',
    wechatUserName: 'wxid_orp7dihe2pm112',
  }
  const actual = {
    inviteeIdList: [ 'wxid_3s4v7osfgpbc22' ],
    inviterId: types.YOU,
    roomId: '20434481305@chatroom',
    timestamp: 1595916797061
  }
  t.deepEqual(await roomJoinEventMessageParser(MESSAGE_PAYLOAD), actual, 'should return actual data')
})
