#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { WechatyCacheMessagePayload, WechatyCacheMessageType } from 'wechaty-cache'
import { PadplusMessagePayload, PadplusMessageType } from '../schemas'

import { cacheToPadplusMessagePayload, padplusToCacheMessagePayload } from './message-cache-mapper'

test('message-cache-mapper', async t => {
  const PADPLUS_MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType                           : 1,
    content                              : 'content',
    createTime                           : 1591071315715,
    fileName                             : 'fileName',
    fromMemberNickName                   : 'fromMemberNickName',
    fromMemberUserName                   : 'fromMemberUserName',
    fromUserName                         : 'fromUserName',
    imgBuf                               : 'imgBuf',
    imgStatus                            : 1,
    l1MsgType                            : 2,
    msgId                                : 'msgId',
    msgSource                            : 'msgSource',
    msgSourceCd                          : 3,
    msgType                              : PadplusMessageType.Text,
    newMsgId                             : 4,
    pushContent                          : 'pushContent',
    status                               : 5,
    toUserName                           : 'toUserName',
    uin                                  : 'uin',
    url                                  : 'url',
    wechatUserName                       : 'wechatUserName',
  }

  const EXPECTED_MESSAGE_PAYLOAD: WechatyCacheMessagePayload = {
    appMsgType                           : 1,
    atUserList                           : [],
    content                              : 'content',
    createTime                           : 1591071315715,
    fileName                             : 'fileName',
    fromMemberNickName                   : 'fromMemberNickName',
    fromMemberUserName                   : 'fromMemberUserName',
    fromUserName                         : 'fromUserName',
    imgBuf                               : 'imgBuf',
    imgStatus                            : 1,
    l1MsgType                            : 2,
    msgId                                : 'msgId',
    msgSource                            : 'msgSource',
    msgSourceCd                          : 3,
    msgType                              : WechatyCacheMessageType.Text,
    newMsgId                             : 4,
    path                                 : undefined,
    pushContent                          : 'pushContent',
    status                               : 5,
    thumbPath                            : undefined,
    toUserName                           : 'toUserName',
    uin                                  : 'uin',
    url                                  : 'url',
    wechatUserName                       : 'wechatUserName',
  }

  const resultCache = padplusToCacheMessagePayload(PADPLUS_MESSAGE_PAYLOAD)
  t.deepEqual(resultCache, EXPECTED_MESSAGE_PAYLOAD, 'should parse MessagePayload for account payload')

  t.throws(() => padplusToCacheMessagePayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheMessagePayload(undefined as any), 'should throw exception for undifined')

  const resultPadplus = cacheToPadplusMessagePayload(EXPECTED_MESSAGE_PAYLOAD)
  t.deepEqual(resultPadplus, PADPLUS_MESSAGE_PAYLOAD, 'should parse MessagePayload for account payload')

  t.throws(() => cacheToPadplusMessagePayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusMessagePayload(undefined as any), 'should throw exception for undifined')
})
