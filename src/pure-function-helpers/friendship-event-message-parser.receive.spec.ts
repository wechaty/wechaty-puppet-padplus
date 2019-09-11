#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  PadplusMessagePayload,
}                             from '../schemas'

import { friendshipReceiveEventMessageParser } from './friendship-event-message-parser'

test('friendshipReceiveEventMessageParser()', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = { appMsgType: undefined,
    content:
     '<msg fromusername="Soul001001" encryptusername="v1_d3f844d04577188009ce06012159148a030ac56a023b12e04193ee8e3c247855@stranger" fromnickname="苏畅👾" content="我是苏畅👾" fullpy="suchang?" shortpy="SC?" imagestatus="3" scene="14" country="CN" province="Beijing" city="Chaoyang" sign="运动达人，跑起来！" percard="1" sex="1" alias="" weibo="" albumflag="3" albumstyle="0" albumbgimgid="" snsflag="49" snsbgimgid="http://mmsns.qpic.cn/mmsns/nibxxlib1VaPc06PZBE2QaelxsjkEicicOUL5pIf4zlnH2DwUCAzwff0TmAO0PmkZRrcvur6Q7BUCnk/0" snsbgobjectid="12192592356836315376" mhash="6cc2b47e5010e62068aa033eb876d87f" mfullhash="6cc2b47e5010e62068aa033eb876d87f" bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/0wZXI95ibjviaVoibltWc0Ve0pjX5SqGLVlWuLPuxOqD79BOj2Eag7w8Vn5fgCruib4icO27OELPhhU3Yh9YNOCgjbg/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/0wZXI95ibjviaVoibltWc0Ve0pjX5SqGLVlWuLPuxOqD79BOj2Eag7w8Vn5fgCruib4icO27OELPhhU3Yh9YNOCgjbg/132" ticket="v2_954c9a997beef990b53e02019a1e94a1b6fb027e4df1f29409ccf458f81389bfe063835af374ffdc91eb94d4ba4cbc1783a31c978fe4eac5dcdba9f03730978b@stranger" opcode="2" googlecontact="" qrticket="" chatroomusername="18972581662@chatroom" sourceusername="" sourcenickname=""><brandlist count="0" ver="670492753"></brandlist></msg>',
    createTime: 1568207994131,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'fmessage',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '3375408822827565742',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 37,
    newMsgId: 3375408822827565600,
    pushContent: '',
    status: 3,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912' }

  const EXPECTED_CONTACT_ID = 'Soul001001'

  const contactName = await friendshipReceiveEventMessageParser(MESSAGE_PAYLOAD)
  t.equal(contactName, EXPECTED_CONTACT_ID, 'should parse message to receive contact id')
})
