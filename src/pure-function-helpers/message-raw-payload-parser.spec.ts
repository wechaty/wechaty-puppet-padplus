// #!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  MessagePayload, MessageType,
}                       from 'wechaty-puppet'

import {
  PadplusMessagePayload,
}                             from '../schemas'

import { messageRawPayloadParser } from './message-raw-payload-parser'

test('messageRawPayloadParser', async t => {

  t.skip('tbw')
  // t.test('text', async t => {
  //   const PADPLUS_MESSAGE_PAYLOAD_TEXT: PadplusMessagePayload = {
  //     content     : '1111',
  //     continue    : 1,
  //     description : 'c7259a70-212f-11e8-b67d-57995e2021bf : 1111',
  //     from_user   : 'qq512436430',
  //     msg_id      : '8394773793402534033',
  //     msg_source  : '<msgsource />\n',
  //     msg_type    : 5,
  //     status      : 1,
  //     sub_type    : 1,
  //     timestamp   : 1526958809,
  //     to_user     : 'wxid_zj2cahpwzgie12',
  //     uin         : 324216852,
  //   }
  //   const EXPECTED_MESSAGE_PAYLOAD_TEXT: MessagePayload = {
  //     //
  //   }
  // })

  // t.test('voice', async t => {
  //   const PADPLUS_MESSAGE_PAYLOAD_VOICE: PadplusMessagePayload = {
  //     // tslint:disable-next-line:max-line-length
  //     content     : '<msg><voicemsg endflag="1" length="5095" voicelength="2700" clientmsgid="49c81578fd517c7679f143e8cf0be116wxid_zj2cahpwzgie12104_1526984920" fromusername="qq512436430" downcount="0" cancelflag="0" voiceformat="4" forwardflag="0" bufid="434549088970015139" /></msg>',
  //     continue    : 1,
  //     // tslint:disable-next-line:max-line-length
  //     data        : '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',
  //     description : '李佳芮 : [语音]',
  //     from_user   : 'qq512436430',
  //     msg_id      : '8502371723610127059',
  //     msg_source  : '',
  //     msg_type    : 5,
  //     status      : 1,
  //     sub_type    : 34,
  //     timestamp   : 1526984922,
  //     to_user     : 'wxid_zj2cahpwzgie12',
  //     uin         : 324216852,
  //   }
  //   const EXPECTED_MESSAGE_PAYLOAD_VOICE: MessagePayload = {
  //     //
  //   }
  // })

})

test('sys', async t => {
  const PADPLUS_MESSAGE_PAYLOAD_SYS: PadplusMessagePayload = {
    content: '23238546298@chatroom:\n<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[你邀请"佳芮"加入了群聊  ]]></plain>\n\t\t<text><![CDATA[你邀请"佳芮"加入了群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_rdwh63c150bm12]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
    createTime: 1568205434181,
    fromMemberUserName: '23238546298@chatroom',
    fromUserName: '23238546298@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '1745697108690097034',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 1745697108690097200,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_MESSAGE_PAYLOAD_SYS: MessagePayload = {
    fromId: undefined,
    id: '1745697108690097034',
    mentionIdList: [],
    roomId: '23238546298@chatroom',
    text: '<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[你邀请"佳芮"加入了群聊  ]]></plain>\n\t\t<text><![CDATA[你邀请"佳芮"加入了群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_rdwh63c150bm12]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
    timestamp: 1568205434.181,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Unknown,
  }

  const payload = await messageRawPayloadParser(PADPLUS_MESSAGE_PAYLOAD_SYS)
  // console.log('payload:', payload)
  t.deepEqual(payload, EXPECTED_MESSAGE_PAYLOAD_SYS, 'should parse sys message payload')
})

test('room invitation created by others', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: 5,
    content: '<msg><appmsg appid="" sdkver=""><title><![CDATA[邀请你加入群聊]]></title><des><![CDATA["高原ོ"邀请你加入群聊舞哩团02群，进入可查看详情。]]></des><action>view</action><type>5</type><showtype>0</showtype><content></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/addchatroombyinvite?ticket=AXRyTvurvCvq0LAjognrPg%3D%3D]]></url><thumburl><![CDATA[https://u.weixin.qq.com/cgi-bin/getchatroomheadimg?username=A27ac8722f7321d8915f06845d25369ed729322a37058e7556fa49f81f631175b&from=1]]></thumburl><lowurl></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext></appattach><extinfo></extinfo></appmsg><appinfo><version></version><appname></appname></appinfo></msg>',
    createTime: 1568205752199,
    fileName: '邀请你加入群聊',
    fromUserName: 'lylezhuifeng',
    imgBuf: '',
    imgStatus: 0,
    l1MsgType: 5,
    msgId: '7451739954714199526',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 49,
    newMsgId: 7451739954714199000,
    pushContent: '',
    status: 3,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    filename: '7451739954714199526-to-be-implement.txt',
    fromId: 'lylezhuifeng',
    id: '7451739954714199526',
    mentionIdList: [],
    roomId: undefined,
    text: '<msg><appmsg appid="" sdkver=""><title><![CDATA[邀请你加入群聊]]></title><des><![CDATA["高原ོ"邀请你加入群聊舞哩团02群，进入可查看详情。]]></des><action>view</action><type>5</type><showtype>0</showtype><content></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/addchatroombyinvite?ticket=AXRyTvurvCvq0LAjognrPg%3D%3D]]></url><thumburl><![CDATA[https://u.weixin.qq.com/cgi-bin/getchatroomheadimg?username=A27ac8722f7321d8915f06845d25369ed729322a37058e7556fa49f81f631175b&from=1]]></thumburl><lowurl></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext></appattach><extinfo></extinfo></appmsg><appinfo><version></version><appname></appname></appinfo></msg>',
    timestamp: 1568205752.199,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Url,
  }

  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse room invitation message payload')
})

test('room ownership transfer message', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '你已成为新群主',
    createTime: 1568206018206,
    fromUserName: '18295482296@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '6345486005160255967',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10000,
    newMsgId: 6345486005160255000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: undefined,
    id: '6345486005160255967',
    mentionIdList: [],
    roomId: '18295482296@chatroom',
    text: '你已成为新群主',
    timestamp: 1568206018.206,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Unknown,
  }

  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse ower transfer message')
})

test('share card peer to peer', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: '<?xml version="1.0" encoding="UTF-8" standalone="no"?><msg ContactFlag="3" alias="" antispamticket="v2_4fc82b8cfcd54be18bebd693a13705e4f804822a1686bd2959a07979994fc22cbdac6cbb584de3751137538a3d41004f@stranger" bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/D7ibkLTEbZ5ZgAZM8mb4eQFGicCBbAst97JXJJ3TORLusf0w1qLrrFxzYxEtnUP4Z4nR69DzA2FEEOntkENslo0w/0" brandFlags="0" brandHomeUrl="" brandIconUrl="" brandSubscriptConfigUrl="" certflag="0" certinfo="" city="中国" fullpy="suchang?" imagestatus="3" nickname="苏畅&#128126;" province="北京" regionCode="CN_Beijing_Chaoyang" scene="17" sex="1" shortpy="" sign="" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/D7ibkLTEbZ5ZgAZM8mb4eQFGicCBbAst97JXJJ3TORLusf0w1qLrrFxzYxEtnUP4Z4nR69DzA2FEEOntkENslo0w/132" username="v1_db2fb22335cd14700c7d70d171e960fbd5d17e3a134f74a1b2663edab59d6265@stranger"/>',
    createTime: 1568206141208,
    fromUserName: 'lylezhuifeng',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '4856541606299990582',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 42,
    newMsgId: 4856541606299991000,
    pushContent: '高原ོ : [名片]苏畅',
    status: 3,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'lylezhuifeng',
    id: '4856541606299990582',
    mentionIdList: [],
    roomId: undefined,
    text: '<?xml version="1.0" encoding="UTF-8" standalone="no"?><msg ContactFlag="3" alias="" antispamticket="v2_4fc82b8cfcd54be18bebd693a13705e4f804822a1686bd2959a07979994fc22cbdac6cbb584de3751137538a3d41004f@stranger" bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/D7ibkLTEbZ5ZgAZM8mb4eQFGicCBbAst97JXJJ3TORLusf0w1qLrrFxzYxEtnUP4Z4nR69DzA2FEEOntkENslo0w/0" brandFlags="0" brandHomeUrl="" brandIconUrl="" brandSubscriptConfigUrl="" certflag="0" certinfo="" city="中国" fullpy="suchang?" imagestatus="3" nickname="苏畅&#128126;" province="北京" regionCode="CN_Beijing_Chaoyang" scene="17" sex="1" shortpy="" sign="" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/D7ibkLTEbZ5ZgAZM8mb4eQFGicCBbAst97JXJJ3TORLusf0w1qLrrFxzYxEtnUP4Z4nR69DzA2FEEOntkENslo0w/132" username="v1_db2fb22335cd14700c7d70d171e960fbd5d17e3a134f74a1b2663edab59d6265@stranger"/>',
    timestamp: 1568206141.208,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Contact,
  }

  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
})

test('share card in room', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: 'lylezhuifeng:\n<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/ibVX6Cxtt58AlLIiczVMA3Vt1IkOOKxnJJKwADcsHibGC1HfkGQEKicbylcjWLxEVSen0Znnnp6DpOqXtiaR7xpYFnWQwtofrpHEuj4O0DdbZ9Is/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/ibVX6Cxtt58AlLIiczVMA3Vt1IkOOKxnJJKwADcsHibGC1HfkGQEKicbylcjWLxEVSen0Znnnp6DpOqXtiaR7xpYFnWQwtofrpHEuj4O0DdbZ9Is/132" username="v1_26802a5a2b8341aa44b60db1d875169c9b80bd08dabfc1aaae46ff9841921bcacc480ebd85edbcb68529638c1588e00f@stranger" nickname="百年-句子技术支持" fullpy="bainiangouzijishuzhichi" shortpy="" alias="" imagestatus="3" scene="17" province="" city="" sign="" sex="0" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="" antispamticket="v2_050f2a36e5e8583abdaea142242cf6ffbc72a980c8f95da1d99bcede3fd01f8944c61690df7fd872eeebadbb6c986e16@stranger" />\n',
    createTime: 1568206684229,
    fileName: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
    fromMemberNickName: '高原ོ ',
    fromMemberUserName: 'lylezhuifeng',
    fromUserName: '18295482296@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '2899852992039617138',
    msgSource: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
    msgSourceCd: 2,
    msgType: 42,
    newMsgId: 2899852992039617000,
    pushContent: '高原ོ : [名片]百年-句子技术支持',
    status: 3,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'lylezhuifeng',
    id: '2899852992039617138',
    mentionIdList: [],
    roomId: '18295482296@chatroom',
    text: '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/ibVX6Cxtt58AlLIiczVMA3Vt1IkOOKxnJJKwADcsHibGC1HfkGQEKicbylcjWLxEVSen0Znnnp6DpOqXtiaR7xpYFnWQwtofrpHEuj4O0DdbZ9Is/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/ibVX6Cxtt58AlLIiczVMA3Vt1IkOOKxnJJKwADcsHibGC1HfkGQEKicbylcjWLxEVSen0Znnnp6DpOqXtiaR7xpYFnWQwtofrpHEuj4O0DdbZ9Is/132" username="v1_26802a5a2b8341aa44b60db1d875169c9b80bd08dabfc1aaae46ff9841921bcacc480ebd85edbcb68529638c1588e00f@stranger" nickname="百年-句子技术支持" fullpy="bainiangouzijishuzhichi" shortpy="" alias="" imagestatus="3" scene="17" province="" city="" sign="" sex="0" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="" antispamticket="v2_050f2a36e5e8583abdaea142242cf6ffbc72a980c8f95da1d99bcede3fd01f8944c61690df7fd872eeebadbb6c986e16@stranger" />\n',
    timestamp: 1568206684.229,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Contact,
  }

  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
})

test('attachment file with ext .xlsx', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: 6,
    content: '<msg><appmsg appid="" sdkver="0"><title>报价.xlsx</title><des></des><action></action><type>6</type><showtype>0</showtype><mediatagname></mediatagname><messageaction></messageaction><content></content><url></url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>11934</totallen><attachid>@cdn_304e020100044730450201000204d8e50c6e02033d0af80204ba30feb602045d78f1e10420777869645f7a6f7662396f6c38366d376c323235305f313536383230373332390204010400050201000400_0780b7157995b47c0e88275d0c40da6a_1</attachid><emoticonmd5></emoticonmd5><fileext>xlsx</fileext><cdnattachurl>304e020100044730450201000204d8e50c6e02033d0af80204ba30feb602045d78f1e10420777869645f7a6f7662396f6c38366d376c323235305f313536383230373332390204010400050201000400</cdnattachurl><aeskey>0780b7157995b47c0e88275d0c40da6a</aeskey><encryver>0</encryver></appattach><extinfo></extinfo><sourceusername></sourceusername><sourcedisplayname></sourcedisplayname><commenturl></commenturl><thumburl></thumburl><md5>420e8bc8986eb1539bbab10d396e814d</md5></appmsg><fromusername>lylezhuifeng</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>',
    createTime: 1568207329248,
    fileName: '报价.xlsx',
    fromUserName: 'lylezhuifeng',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '4361591746319570095',
    msgSource: '<msgsource />\n',
    msgSourceCd: 2,
    msgType: 49,
    newMsgId: 4361591746319570000,
    pushContent: '高原ོ : [文件]报价.xlsx',
    status: 3,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    filename: '报价.xlsx',
    fromId: 'lylezhuifeng',
    id: '4361591746319570095',
    mentionIdList: [],
    roomId: undefined,
    text: '<msg><appmsg appid="" sdkver="0"><title>报价.xlsx</title><des></des><action></action><type>6</type><showtype>0</showtype><mediatagname></mediatagname><messageaction></messageaction><content></content><url></url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>11934</totallen><attachid>@cdn_304e020100044730450201000204d8e50c6e02033d0af80204ba30feb602045d78f1e10420777869645f7a6f7662396f6c38366d376c323235305f313536383230373332390204010400050201000400_0780b7157995b47c0e88275d0c40da6a_1</attachid><emoticonmd5></emoticonmd5><fileext>xlsx</fileext><cdnattachurl>304e020100044730450201000204d8e50c6e02033d0af80204ba30feb602045d78f1e10420777869645f7a6f7662396f6c38366d376c323235305f313536383230373332390204010400050201000400</cdnattachurl><aeskey>0780b7157995b47c0e88275d0c40da6a</aeskey><encryver>0</encryver></appattach><extinfo></extinfo><sourceusername></sourceusername><sourcedisplayname></sourcedisplayname><commenturl></commenturl><thumburl></thumburl><md5>420e8bc8986eb1539bbab10d396e814d</md5></appmsg><fromusername>lylezhuifeng</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>',
    timestamp: 1568207329.248,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Attachment,
  }

  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
})

test('others recalled message in room', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    content: 'lylezhuifeng:\n<sysmsg type="revokemsg"><revokemsg><session>18295482296@chatroom</session><msgid>1672045621</msgid><newmsgid>6800642263058603981</newmsgid><replacemsg><![CDATA["高原ོ" 撤回了一条消息]]></replacemsg></revokemsg></sysmsg>',
    createTime: 1568207817258,
    fromMemberUserName: 'lylezhuifeng',
    fromUserName: '18295482296@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '7451323945505661106',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 7451323945505661000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'lylezhuifeng',
    id: '7451323945505661106',
    mentionIdList: [],
    roomId: '18295482296@chatroom',
    text: '6800642263058603981',
    timestamp: 1568207817.258,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Recalled,
  }
  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload,
    EXPECTED_PAYLOAD,
    'should parse recalled message in room')
})

test('bot recalled message in room', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '<sysmsg type="revokemsg"><revokemsg><session>23446751259@chatroom</session><msgid>1670494294</msgid><newmsgid>245587684513446090</newmsgid><replacemsg><![CDATA[你撤回了一条消息]]></replacemsg></revokemsg></sysmsg>',
    createTime: 1568776956065,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: '23446751259@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '3195375600040238004',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 3195375600040238000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'wxid_v7j3e9kna9l912',
    id: '3195375600040238004',
    mentionIdList: [],
    roomId: '23446751259@chatroom',
    text: '245587684513446090',
    timestamp: 1568776956.065,
    toId: 'wxid_v7j3e9kna9l912',
    type: MessageType.Recalled,
  }
  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload,
    EXPECTED_PAYLOAD,
    'should parse recalled message in room')
})

test('others recalled message in private chat', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '<sysmsg type="revokemsg">\n\t<revokemsg>\n\t\t<session>Soul001001</session>\n\t\t<msgid>1093970572</msgid>\n\t\t<newmsgid>3169605043756821364</newmsgid>\n\t\t<replacemsg><![CDATA["苏畅183" 撤回了一条消息]]></replacemsg>\n\t</revokemsg>\n</sysmsg>\n',
    createTime: 1568777325070,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'Soul001001',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '8551294433062845570',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 8551294433062845000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'Soul001001',
    id: '8551294433062845570',
    mentionIdList: [],
    roomId: undefined,
    text: '3169605043756821364',
    timestamp: 1568777325.07,
    toId: 'wxid_v7j3e9kna9l912',
    type: MessageType.Recalled,
  }
  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload,
    EXPECTED_PAYLOAD,
    'should parse recalled message in private message')
})

test('bot recalled message in private chat', async t => {
  const MESSAGE_PAYLOAD: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '<sysmsg type="revokemsg"><revokemsg><session>Soul001001</session><msgid>1670494297</msgid><newmsgid>5435185973422451659</newmsgid><replacemsg><![CDATA[你撤回了一条消息]]></replacemsg></revokemsg></sysmsg>',
    createTime: 1568777162068,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'Soul001001',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '5403623995065243191',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 10002,
    newMsgId: 5403623995065244000,
    pushContent: '',
    status: 4,
    toUserName: 'wxid_v7j3e9kna9l912',
    uin: '2978186714',
    url: undefined,
    wechatUserName: 'wxid_v7j3e9kna9l912',
  }

  const EXPECTED_PAYLOAD: MessagePayload = {
    fromId: 'wxid_v7j3e9kna9l912',
    id: '5403623995065243191',
    mentionIdList: [],
    roomId: undefined,
    text: '5435185973422451659',
    timestamp: 1568777162.068,
    toId: 'Soul001001',
    type: MessageType.Recalled,
  }
  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload,
    EXPECTED_PAYLOAD,
    'should parse recalled message in private message')
})

// test('Official account sent url', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content: '<msg><appmsg appid="" sdkver="0"><title><![CDATA[这是一个测试的图文消息]]></title><des><![CDATA[其实没有正文]]></des><action></action><type>5</type><showtype>1</showtype><soundtype>0</soundtype><content><![CDATA[]]></content><contentattr>0</contentattr><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><lowurl><![CDATA[]]></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext><cdnthumburl><![CDATA[]]></cdnthumburl><cdnthumbaeskey><![CDATA[]]></cdnthumbaeskey><aeskey><![CDATA[]]></aeskey></appattach><extinfo></extinfo><sourceusername><![CDATA[]]></sourceusername><sourcedisplayname><![CDATA[]]></sourcedisplayname><mmreader><category type="20" count="1"><name><![CDATA[桔小秘]]></name><topnew><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></cover><width>0</width><height>0</height><digest><![CDATA[其实没有正文]]></digest></topnew><item><itemshowtype>0</itemshowtype><title><![CDATA[这是一个测试的图文消息]]></title><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><shorturl><![CDATA[]]></shorturl><longurl><![CDATA[]]></longurl><pub_time>1559707865</pub_time><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0|0|0]]></cover><tweetid></tweetid><digest><![CDATA[其实没有正文]]></digest><fileid>100000002</fileid><sources><source><name><![CDATA[桔小秘]]></name></source></sources><styles></styles><native_url></native_url><del_flag>0</del_flag><contentattr>0</contentattr><play_length>0</play_length><play_url><![CDATA[]]></play_url><player><![CDATA[]]></player><template_op_type>0</template_op_type><weapp_username><![CDATA[]]></weapp_username><weapp_path><![CDATA[]]></weapp_path><weapp_version>0</weapp_version><weapp_state>0</weapp_state><music_source>0</music_source><pic_num>0</pic_num><show_complaint_button>0</show_complaint_button><vid><![CDATA[]]></vid><recommendation><![CDATA[]]></recommendation><pic_urls></pic_urls><comment_topic_id>0</comment_topic_id><cover_235_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_235_1><cover_1_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJImBzbaibFQRBTEGjHFmNjF0P3BjdyjAe7a985o3b8zWFNH6fLEXH6ficiaQ/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_1_1><appmsg_like_type>2</appmsg_like_type><video_width>0</video_width><video_height>0</video_height></item></category><publisher><username><![CDATA[gh_87e03c422b73]]></username><nickname><![CDATA[桔小秘]]></nickname></publisher><template_header></template_header><template_detail></template_detail><forbid_forward>0</forbid_forward></mmreader><thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></thumburl></appmsg><fromusername><![CDATA[gh_87e03c422b73]]></fromusername><appinfo><version>0</version><appname><![CDATA[桔小秘]]></appname><isforceupdate>1</isforceupdate></appinfo></msg>',
//     data: null,
//     fromUser: 'gh_87e03c422b73',
//     messageId: '1006688399',
//     messageSource: '<msgsource>\n\t<tips>3</tips>\n\t<bizmsg>\n\t\t<bizmsgshowtype>0</bizmsgshowtype>\n\t\t<bizmsgfromuser><![CDATA[gh_87e03c422b73]]></bizmsgfromuser>\n\t</bizmsg>\n\t<msg_cluster_type>0</msg_cluster_type>\n\t<service_type>1</service_type>\n\t<scene>1</scene>\n</msgsource>\n',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559707890,
//     toUser: 'wxid_x01jgln69ath22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1006688399-to-be-implement.txt',
//     fromId: 'gh_87e03c422b73',
//     id: '1006688399',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg><appmsg appid="" sdkver="0"><title><![CDATA[这是一个测试的图文消息]]></title><des><![CDATA[其实没有正文]]></des><action></action><type>5</type><showtype>1</showtype><soundtype>0</soundtype><content><![CDATA[]]></content><contentattr>0</contentattr><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><lowurl><![CDATA[]]></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext><cdnthumburl><![CDATA[]]></cdnthumburl><cdnthumbaeskey><![CDATA[]]></cdnthumbaeskey><aeskey><![CDATA[]]></aeskey></appattach><extinfo></extinfo><sourceusername><![CDATA[]]></sourceusername><sourcedisplayname><![CDATA[]]></sourcedisplayname><mmreader><category type="20" count="1"><name><![CDATA[桔小秘]]></name><topnew><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></cover><width>0</width><height>0</height><digest><![CDATA[其实没有正文]]></digest></topnew><item><itemshowtype>0</itemshowtype><title><![CDATA[这是一个测试的图文消息]]></title><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><shorturl><![CDATA[]]></shorturl><longurl><![CDATA[]]></longurl><pub_time>1559707865</pub_time><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0|0|0]]></cover><tweetid></tweetid><digest><![CDATA[其实没有正文]]></digest><fileid>100000002</fileid><sources><source><name><![CDATA[桔小秘]]></name></source></sources><styles></styles><native_url></native_url><del_flag>0</del_flag><contentattr>0</contentattr><play_length>0</play_length><play_url><![CDATA[]]></play_url><player><![CDATA[]]></player><template_op_type>0</template_op_type><weapp_username><![CDATA[]]></weapp_username><weapp_path><![CDATA[]]></weapp_path><weapp_version>0</weapp_version><weapp_state>0</weapp_state><music_source>0</music_source><pic_num>0</pic_num><show_complaint_button>0</show_complaint_button><vid><![CDATA[]]></vid><recommendation><![CDATA[]]></recommendation><pic_urls></pic_urls><comment_topic_id>0</comment_topic_id><cover_235_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_235_1><cover_1_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJImBzbaibFQRBTEGjHFmNjF0P3BjdyjAe7a985o3b8zWFNH6fLEXH6ficiaQ/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_1_1><appmsg_like_type>2</appmsg_like_type><video_width>0</video_width><video_height>0</video_height></item></category><publisher><username><![CDATA[gh_87e03c422b73]]></username><nickname><![CDATA[桔小秘]]></nickname></publisher><template_header></template_header><template_detail></template_detail><forbid_forward>0</forbid_forward></mmreader><thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></thumburl></appmsg><fromusername><![CDATA[gh_87e03c422b73]]></fromusername><appinfo><version>0</version><appname><![CDATA[桔小秘]]></appname><isforceupdate>1</isforceupdate></appinfo></msg>',
//     timestamp: 1559707890,
//     toId: 'wxid_x01jgln69ath22',
//     type: MessageType.Recalled,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse official account sent url.')
// })

// test('Special Official account sent url', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg>\n    <appmsg appid="" sdkver="0">\n        <title><![CDATA[“演员”孙宇晨]]></title>\n        <des><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></des>\n        <action></action>\n        <type>5</type>\n        <showtype>1</showtype>\n        <content><![CDATA[]]></content>\n        <contentattr>0</contentattr>\n        <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n        <lowurl><![CDATA[]]></lowurl>\n        <appattach>\n            <totallen>0</totallen>\n            <attachid></attachid>\n            <fileext></fileext>\n        </appattach>\n        <extinfo></extinfo>\n        <mmreader>\n            <category type="20" count="3">\n                <name><![CDATA[i黑马]]></name>\n                <topnew>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <width>0</width>\n                    <height>0</height>\n                    <digest><![CDATA[]]></digest>\n                </topnew>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[“演员”孙宇晨]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></digest>\n                    <fileid>504497991</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998215241730</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwkpDqDNz993sQ9gCrMDGdWFbcgFI6VEqjDaSib64f9qFUhFpgrumJNaQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[深创投孙东升：专业化是本土创投转型升级的必由之路]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=2&sn=381549b29d86e05b34d4459faf5ba76e&chksm=73d0057e44a78c6801d1b1c39da099d6db7b1ae796dc976b0d3faeb5a22bc61599c4c3e84422&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮不追热点、重技术创新，投资主要集中于智能制造、生物医药、新一代通讯技术、新材料等硬科技项目。]]></digest>\n                    <fileid>504497993</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998986993664</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[松禾资本厉伟：老老实实做生意]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=3&sn=efda768aa069ae00df91a2b899127ccf&chksm=73d0057e44a78c686c851673d132dd009646c561ad2a2faa87a8c0f56bb682613298640aa0c8&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮已成为中国风投界主流，他们投资的技术企业也成为中国技术创新的中流砥柱。]]></digest>\n                    <fileid>504497994</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787999741968385</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n            </category>\n            <publisher>\n                <username><![CDATA[wxid_2965349653612]]></username>\n                <nickname><![CDATA[i黑马]]></nickname>\n            </publisher>\n            <template_header></template_header>\n            <template_detail></template_detail>\n            <forbid_forward>0</forbid_forward>\n        </mmreader>\n        <thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></thumburl>\n    </appmsg>\n    <fromusername><![CDATA[wxid_2965349653612]]></fromusername>\n    <appinfo>\n        <version></version>\n        <appname><![CDATA[i黑马]]></appname>\n        <isforceupdate>1</isforceupdate>\n    </appinfo>\n    \n    \n    \n    \n    \n    \n</msg>',
//     data: null,
//     fromUser: 'wxid_2965349653612',
//     messageId: '1601417885',
//     messageSource: '<msgsource>\n\t<bizmsg>\n\t\t<bizclientmsgid><![CDATA[mmbizcluster_1_1074353501_1000002540]]></bizclientmsgid>\n\t\t<msg_predict>0</msg_predict>\n\t</bizmsg>\n\t<bizflag>0</bizflag>\n\t<msg_cluster_type>3</msg_cluster_type>\n\t<service_type>0</service_type>\n</msgsource>\n',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559707752,
//     toUser: 'wxid_x01jgln69ath22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1601417885-to-be-implement.txt',
//     fromId: 'wxid_2965349653612',
//     id: '1601417885',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg>\n    <appmsg appid="" sdkver="0">\n        <title><![CDATA[“演员”孙宇晨]]></title>\n        <des><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></des>\n        <action></action>\n        <type>5</type>\n        <showtype>1</showtype>\n        <content><![CDATA[]]></content>\n        <contentattr>0</contentattr>\n        <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n        <lowurl><![CDATA[]]></lowurl>\n        <appattach>\n            <totallen>0</totallen>\n            <attachid></attachid>\n            <fileext></fileext>\n        </appattach>\n        <extinfo></extinfo>\n        <mmreader>\n            <category type="20" count="3">\n                <name><![CDATA[i黑马]]></name>\n                <topnew>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <width>0</width>\n                    <height>0</height>\n                    <digest><![CDATA[]]></digest>\n                </topnew>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[“演员”孙宇晨]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></digest>\n                    <fileid>504497991</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998215241730</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwkpDqDNz993sQ9gCrMDGdWFbcgFI6VEqjDaSib64f9qFUhFpgrumJNaQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[深创投孙东升：专业化是本土创投转型升级的必由之路]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=2&sn=381549b29d86e05b34d4459faf5ba76e&chksm=73d0057e44a78c6801d1b1c39da099d6db7b1ae796dc976b0d3faeb5a22bc61599c4c3e84422&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮不追热点、重技术创新，投资主要集中于智能制造、生物医药、新一代通讯技术、新材料等硬科技项目。]]></digest>\n                    <fileid>504497993</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998986993664</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[松禾资本厉伟：老老实实做生意]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=3&sn=efda768aa069ae00df91a2b899127ccf&chksm=73d0057e44a78c686c851673d132dd009646c561ad2a2faa87a8c0f56bb682613298640aa0c8&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮已成为中国风投界主流，他们投资的技术企业也成为中国技术创新的中流砥柱。]]></digest>\n                    <fileid>504497994</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787999741968385</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n            </category>\n            <publisher>\n                <username><![CDATA[wxid_2965349653612]]></username>\n                <nickname><![CDATA[i黑马]]></nickname>\n            </publisher>\n            <template_header></template_header>\n            <template_detail></template_detail>\n            <forbid_forward>0</forbid_forward>\n        </mmreader>\n        <thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></thumburl>\n    </appmsg>\n    <fromusername><![CDATA[wxid_2965349653612]]></fromusername>\n    <appinfo>\n        <version></version>\n        <appname><![CDATA[i黑马]]></appname>\n        <isforceupdate>1</isforceupdate>\n    </appinfo>\n    \n    \n    \n    \n    \n    \n</msg>',
//     timestamp: 1559707752,
//     toId: 'wxid_x01jgln69ath22',
//     type: MessageType.Recalled,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse official account sent url.')
// })

test('Transfer money message', async t => {
  const MESSAGE_PAYLOAD = {
    appMsgType: 2000,
    content: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119091100065311563152679024]]></transcationid><transferid><![CDATA[1000050101201909111009170910447]]></transferid><invalidtime><![CDATA[1568299743]]></invalidtime><begintransfertime><![CDATA[1568207943]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
    createTime: 1568207943259,
    fileName: '微信转账',
    fromUserName: 'lylezhuifeng',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '2632022077853375799',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 49,
    newMsgId: 2632022077853376000,
    pushContent: '高原ོ : [转账]',
    status: 3,
    toUserName: 'wxid_zovb9ol86m7l22',
    uin: '2963338780',
    wechatUserName: 'wxid_zovb9ol86m7l22',
  }
  const EXPECTED_PAYLOAD: MessagePayload = {
    filename: '2632022077853375799-to-be-implement.txt',
    fromId: 'lylezhuifeng',
    id: '2632022077853375799',
    mentionIdList: [],
    roomId: undefined,
    text: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119091100065311563152679024]]></transcationid><transferid><![CDATA[1000050101201909111009170910447]]></transferid><invalidtime><![CDATA[1568299743]]></invalidtime><begintransfertime><![CDATA[1568207943]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
    timestamp: 1568207943.259,
    toId: 'wxid_zovb9ol86m7l22',
    type: MessageType.Transfer,
  }
  const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
  t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money message.')
})

// test('Transfer money confirm message', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg>\n<appmsg appid="" sdkver="">\n<title><![CDATA[微信转账]]></title>\n<des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des>\n<action></action>\n<type>2000</type>\n<content><![CDATA[]]></content>\n<url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url>\n<thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl>\n<lowurl></lowurl>\n<extinfo>\n</extinfo>\n<wcpayinfo>\n<paysubtype>3</paysubtype>\n<feedesc><![CDATA[￥0.10]]></feedesc>\n<transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid>\n<transferid><![CDATA[1000050101201906050603597352768]]></transferid>\n<invalidtime><![CDATA[1559802091]]></invalidtime>\n<begintransfertime><![CDATA[1559715691]]></begintransfertime>\n<effectivedate><![CDATA[1]]></effectivedate>\n<pay_memo><![CDATA[]]></pay_memo>\n\n\n</wcpayinfo>\n</appmsg>\n</msg>',
//     data: null,
//     fromUser: 'wxid_x01jgln69ath22',
//     messageId: '1601417905',
//     messageSource: '',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559715714,
//     toUser: 'lylezhuifeng',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1601417905-to-be-implement.txt',
//     fromId: 'wxid_x01jgln69ath22',
//     id: '1601417905',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg>\n<appmsg appid="" sdkver="">\n<title><![CDATA[微信转账]]></title>\n<des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des>\n<action></action>\n<type>2000</type>\n<content><![CDATA[]]></content>\n<url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url>\n<thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl>\n<lowurl></lowurl>\n<extinfo>\n</extinfo>\n<wcpayinfo>\n<paysubtype>3</paysubtype>\n<feedesc><![CDATA[￥0.10]]></feedesc>\n<transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid>\n<transferid><![CDATA[1000050101201906050603597352768]]></transferid>\n<invalidtime><![CDATA[1559802091]]></invalidtime>\n<begintransfertime><![CDATA[1559715691]]></begintransfertime>\n<effectivedate><![CDATA[1]]></effectivedate>\n<pay_memo><![CDATA[]]></pay_memo>\n\n\n</wcpayinfo>\n</appmsg>\n</msg>',
//     timestamp: 1559715714,
//     toId: 'lylezhuifeng',
//     type: MessageType.Transfer,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money confirm message.')
// })
