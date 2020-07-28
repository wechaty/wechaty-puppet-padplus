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

test('roomTopicEventMessageParser() EN-other-modify-topic', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: "24674062762@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\"$username$\" changed the group name to \"$remark$\"]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"username\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_8kg1wdu3jvk322]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[疫情小助手]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"remark\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[new topic]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n",
    createTime: 1595937860255,
    fromMemberUserName: '24674062762@chatroom',
    fromUserName: '24674062762@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '6943891507426521668',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 6943891507426522000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_orp7dihe2pm112',
    uin: '289099750',
    wechatUserName: 'wxid_orp7dihe2pm112',
  }
  const EXPECTED_EVENT: RoomTopicEvent = {
    changerId: 'wxid_8kg1wdu3jvk322',
    roomId: '24674062762@chatroom',
    timestamp: 1595937860255,
    topic: 'new topic',
  }

  const event = await roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomTopicEventMessageParser() EN-bot-modify-topic', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: 'You changed the group name to \"new topic ！\"',
    createTime: 1595938073258,
    fromUserName: '24674062762@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '666326374143297636',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 666326374143297700,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_orp7dihe2pm112',
    uin: '289099750',
    wechatUserName: 'wxid_orp7dihe2pm112'
  }
  const EXPECTED_EVENT: RoomTopicEvent = {
    changerId: YOU,
    roomId: '24674062762@chatroom',
    timestamp: 1595938073258,
    topic: 'new topic ！',
  }

  const event = await roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})
