#!/usr/bin/env ts-node
/* eslint-disable */
// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  YOU,
}                               from 'wechaty-puppet'

import {
  PadplusMessagePayload, RoomTopicEvent,
}                               from '../schemas'

import { roomTopicEventMessageParser }  from './room-event-topic-message-parser'

test('roomTopicEventMessageParser() ZH-bot-modify-topic', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '"24674062762@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\"$username$\"修改群名为“$remark$”]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"username\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_8kg1wdu3jvk322]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[疫情小助手]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"remark\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[测试群]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
    createTime: 1595936004247,
    fromUserName: '24674062762@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '4392351666543040436',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 4392351666543040500,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_EVENT: RoomTopicEvent = {
    changerId: 'wxid_8kg1wdu3jvk322',
    roomId: '24674062762@chatroom',
    timestamp: 1595936004247,
    topic: '测试群',
  }

  const event = await roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomTopicEventMessageParser() ZH-other-modify-topic', async t => {
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
  const EXPECTED_EVENT: RoomTopicEvent = {
    changerId: YOU,
    roomId: '18295482296@chatroom',
    timestamp: 1568208437265,
    topic: '命名了',
  }

  const event = await roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})
