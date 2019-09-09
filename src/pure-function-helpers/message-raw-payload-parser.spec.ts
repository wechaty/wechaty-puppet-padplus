// #!/usr/bin/env ts-node

// // tslint:disable:max-line-length
// // tslint:disable:no-shadowed-variable

// import test  from 'blue-tape'

// import {
//   MessagePayload,
// }                       from 'wechaty-puppet'

// import {
//   PadplusMessagePayload,
// }                             from '../schemas'

// import { messageRawPayloadParser } from './message-raw-payload-parser'

// test('messageRawPayloadParser', async t => {

//   t.skip('tbw')
//   // t.test('text', async t => {
//   //   const PADCHAT_MESSAGE_PAYLOAD_TEXT: PadplusMessagePayload = {
//   //     content     : '1111',
//   //     continue    : 1,
//   //     description : 'c7259a70-212f-11e8-b67d-57995e2021bf : 1111',
//   //     from_user   : 'qq512436430',
//   //     msg_id      : '8394773793402534033',
//   //     msg_source  : '<msgsource />\n',
//   //     msg_type    : 5,
//   //     status      : 1,
//   //     sub_type    : 1,
//   //     timestamp   : 1526958809,
//   //     to_user     : 'wxid_zj2cahpwzgie12',
//   //     uin         : 324216852,
//   //   }
//   //   const EXPECTED_MESSAGE_PAYLOAD_TEXT: MessagePayload = {
//   //     //
//   //   }
//   // })

//   // t.test('voice', async t => {
//   //   const PADCHAT_MESSAGE_PAYLOAD_VOICE: PadplusMessagePayload = {
//   //     // tslint:disable-next-line:max-line-length
//   //     content     : '<msg><voicemsg endflag="1" length="5095" voicelength="2700" clientmsgid="49c81578fd517c7679f143e8cf0be116wxid_zj2cahpwzgie12104_1526984920" fromusername="qq512436430" downcount="0" cancelflag="0" voiceformat="4" forwardflag="0" bufid="434549088970015139" /></msg>',
//   //     continue    : 1,
//   //     // tslint:disable-next-line:max-line-length
//   //     data        : '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',
//   //     description : '李佳芮 : [语音]',
//   //     from_user   : 'qq512436430',
//   //     msg_id      : '8502371723610127059',
//   //     msg_source  : '',
//   //     msg_type    : 5,
//   //     status      : 1,
//   //     sub_type    : 34,
//   //     timestamp   : 1526984922,
//   //     to_user     : 'wxid_zj2cahpwzgie12',
//   //     uin         : 324216852,
//   //   }
//   //   const EXPECTED_MESSAGE_PAYLOAD_VOICE: MessagePayload = {
//   //     //
//   //   }
//   // })

// })

// test('sys', async t => {
//   const PADCHAT_MESSAGE_PAYLOAD_SYS: PadplusMessagePayload = {
//     content      : '李卓桓 invited you to a group chat with ',
//     data         : '',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '6633562959389269859',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528653783,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_MESSAGE_PAYLOAD_SYS: MessagePayload = {
//     fromId       : undefined,
//     id           : '6633562959389269859',
//     mentionIdList: undefined,
//     roomId       : '3453262102@chatroom',
//     text         : '李卓桓 invited you to a group chat with ',
//     timestamp    : 1528653783,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(PADCHAT_MESSAGE_PAYLOAD_SYS)
//   // console.log('payload:', payload)
//   t.deepEqual(payload, EXPECTED_MESSAGE_PAYLOAD_SYS, 'should parse sys message payload')
// })

// test('status notify', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '<msg>\n<op id=\'2\'>\n<username>fanweixiao</username>\n</op>\n</msg>',
//     data         : '',
//     fromUser     : 'lizhuohuan',
//     messageId    : '6102392425730186619',
//     messageSource: '',
//     messageType  : 51,
//     status       : 1,
//     timestamp    : 1528658339,
//     toUser       : 'fanweixiao',
//   }

//   const EXPECTED_MESSAGE_PAYLOAD: MessagePayload = {
//     fromId       : 'lizhuohuan',
//     id           : '6102392425730186619',
//     mentionIdList: undefined,
//     roomId       : undefined,
//     text         : '<msg>\n<op id=\'2\'>\n<username>fanweixiao</username>\n</op>\n</msg>',
//     timestamp    : 1528658339,
//     toId         : 'fanweixiao',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

//   t.deepEqual(payload, EXPECTED_MESSAGE_PAYLOAD, 'should parse status notify message payload')
// })

// test('room invitation created by bot', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '3453262102@chatroom:\n<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_a8d806dzznm822]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     data         : '',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '4030118997146183783',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528755135,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : undefined,
//     id           : '4030118997146183783',
//     mentionIdList: undefined,
//     roomId       : '3453262102@chatroom',
//     text         : '<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_a8d806dzznm822]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     timestamp    : 1528755135,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse room invitation message payload')
// })

// test('room ownership transfer message', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '你已成为新群主',
//     data         : '',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '3798725634572049107',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1527689361,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : undefined,
//     id           : '3798725634572049107',
//     mentionIdList: undefined,
//     roomId       : '6350854677@chatroom',
//     text         : '你已成为新群主',
//     timestamp    : 1527689361,
//     toId         : 'wxid_zj2cahpwzgie12',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse ower transfer message')
// })

// test('StatusNotify to roomId', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '<msg>\n<op id=\'5\'>\n<username>5367653125@chatroom</username>\n</op>\n</msg>',
//     data         : '',
//     fromUser     : 'wxid_5zj4i5htp9ih22',
//     messageId    : '179056144527271247',
//     messageSource: '',
//     messageType  : 51,
//     status       : 1,
//     timestamp    : 1528920139,
//     toUser       : '5367653125@chatroom',
//   }
//   const EXPECTED_PAYLOAD = {
//     fromId       : 'wxid_5zj4i5htp9ih22',
//     id           : '179056144527271247',
//     mentionIdList: undefined,
//     roomId       : '5367653125@chatroom',
//     text         : '<msg>\n<op id=\'5\'>\n<username>5367653125@chatroom</username>\n</op>\n</msg>',
//     timestamp    : 1528920139,
//     toId         : undefined,
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse status notify message to room id')
// })

// test('share card peer to peer', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6ded4b0c4861a88f3ead9b2c89bce028fa56f345d8e7cf5479dc94a6e13b5b42ec@stranger"/>\n',
//     data         : '',
//     fromUser     : 'lizhuohuan',
//     messageId    : '5911987709823889005',
//     messageSource: '',
//     messageType  : 42,
//     status       : 1,
//     timestamp    : 1528959169,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : 'lizhuohuan',
//     id           : '5911987709823889005',
//     mentionIdList: undefined,
//     roomId       : undefined,
//     text         : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6ded4b0c4861a88f3ead9b2c89bce028fa56f345d8e7cf5479dc94a6e13b5b42ec@stranger"/>\n',
//     timestamp    : 1528959169,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 3,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
// })

// test('share card in room', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : 'lizhuohuan:\n<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6db1ed42e77e0315ea11fb27d92b0641b586bd45a67c9c282b7a6c17430f15c0c3@stranger" />\n',
//     data         : '',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '7332176666514216982',
//     messageSource: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
//     messageType  : 42,
//     status       : 1,
//     timestamp    : 1528961383,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : 'lizhuohuan',
//     id           : '7332176666514216982',
//     mentionIdList: undefined,
//     roomId       : '3453262102@chatroom',
//     text         : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6db1ed42e77e0315ea11fb27d92b0641b586bd45a67c9c282b7a6c17430f15c0c3@stranger" />\n',
//     timestamp    : 1528961383,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 3,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
// })

// test('attachment file with ext .xlsx', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '<msg><appmsg appid="" sdkver="0"><title>面试--运营助理.xlsx</title><des></des><action></action><type>6</type><showtype>0</showtype><mediatagname></mediatagname><messageaction></messageaction><content></content><url></url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>29001</totallen><attachid>@cdn_304f0201000448304602010002040592f70202033d0af802046631feb602045b235b5f0421777869645f7a6a3263616870777a67696531323136365f313532393034333830370204010400050201000400_abee7526f03e4d598aee3f36a9f6cf87_1</attachid><emoticonmd5></emoticonmd5><fileext>xlsx</fileext><cdnattachurl>304f0201000448304602010002040592f70202033d0af802046631feb602045b235b5f0421777869645f7a6a3263616870777a67696531323136365f313532393034333830370204010400050201000400</cdnattachurl><aeskey>abee7526f03e4d598aee3f36a9f6cf87</aeskey><encryver>0</encryver></appattach><extinfo></extinfo><sourceusername></sourceusername><sourcedisplayname></sourcedisplayname><commenturl></commenturl><thumburl></thumburl><md5>73dd2e7c3ec58bbae471dc2d6374578a</md5></appmsg><fromusername>qq512436430</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>',
//     data         : '',
//     fromUser     : 'qq512436430',
//     messageId    : '7844942963127630689',
//     messageSource: '<msgsource />\n',
//     messageType  : 49,
//     status       : 1,
//     timestamp    : 1529043807,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '面试--运营助理.xlsx',
//     fromId: 'qq512436430',
//     id: '7844942963127630689',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg><appmsg appid="" sdkver="0"><title>面试--运营助理.xlsx</title><des></des><action></action><type>6</type><showtype>0</showtype><mediatagname></mediatagname><messageaction></messageaction><content></content><url></url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>29001</totallen><attachid>@cdn_304f0201000448304602010002040592f70202033d0af802046631feb602045b235b5f0421777869645f7a6a3263616870777a67696531323136365f313532393034333830370204010400050201000400_abee7526f03e4d598aee3f36a9f6cf87_1</attachid><emoticonmd5></emoticonmd5><fileext>xlsx</fileext><cdnattachurl>304f0201000448304602010002040592f70202033d0af802046631feb602045b235b5f0421777869645f7a6a3263616870777a67696531323136365f313532393034333830370204010400050201000400</cdnattachurl><aeskey>abee7526f03e4d598aee3f36a9f6cf87</aeskey><encryver>0</encryver></appattach><extinfo></extinfo><sourceusername></sourceusername><sourcedisplayname></sourcedisplayname><commenturl></commenturl><thumburl></thumburl><md5>73dd2e7c3ec58bbae471dc2d6374578a</md5></appmsg><fromusername>qq512436430</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>',
//     timestamp: 1529043807,
//     toId: 'wxid_zj2cahpwzgie12',
//     type: 1,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
// })

// test('recalled message in room', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content: '<sysmsg type="revokemsg">\n\t<revokemsg>\n\t\t<session>lylezhuifeng</session>\n\t\t<msgid>1062840803</msgid>\n\t\t<newmsgid>2244146148648143901</newmsgid>\n\t\t<replacemsg><![CDATA["高原ོ" 撤回了一条消息]]></replacemsg>\n\t</revokemsg>\n</sysmsg>\n',
//     data: null,
//     fromUser: 'lylezhuifeng',
//     messageId: '1062840804',
//     messageSource: '',
//     messageType: 10002,
//     status: 4,
//     timestamp: 1553853738,
//     toUser: 'wxid_zovb9ol86m7l22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId: 'lylezhuifeng',
//     id: '1062840804',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '1062840803',
//     timestamp: 1553853738,
//     toId: 'wxid_zovb9ol86m7l22',
//     type: 11,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse recalled message in room')
// })

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
//     type: 12,
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
//     type: 12,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse official account sent url.')
// })

// test('Transfer money message', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid><transferid><![CDATA[1000050101201906050603597352768]]></transferid><invalidtime><![CDATA[1559807491]]></invalidtime><begintransfertime><![CDATA[1559715691]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
//     data: null,
//     fromUser: 'lylezhuifeng',
//     messageId: '1006688402',
//     messageSource: '',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559715691,
//     toUser: 'wxid_x01jgln69ath22',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1006688402-to-be-implement.txt',
//     fromId: 'lylezhuifeng',
//     id: '1006688402',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid><transferid><![CDATA[1000050101201906050603597352768]]></transferid><invalidtime><![CDATA[1559807491]]></invalidtime><begintransfertime><![CDATA[1559715691]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
//     timestamp: 1559715691,
//     toId: 'wxid_x01jgln69ath22',
//     type: 10,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money message.')
// })

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
//     type: 10,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money confirm message.')
// })
