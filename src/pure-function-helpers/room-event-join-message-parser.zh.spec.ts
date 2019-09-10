#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
// import test  from 'blue-tape'

// import {
//   PuppetRoomJoinEvent,
//   YOU,
// }                               from 'wechaty-puppet'

// import {
//   PadplusMessagePayload,
// }                                 from '../schemas'

// import { roomJoinEventMessageParser }  from './room-event-join-message-parser'

// test('roomJoinEventMessageParser() ZH-other-invite-other', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"李卓桓"邀请"Huan LI++"加入了群聊',
//     fromUser     : '5354656522@chatroom',
//     messageId    : '1303222499352704462',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528657265,
//     toUser       : 'wxid_a8d806dzznm822',
//   }

//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList: ['Huan LI++'],
//     inviterName: '李卓桓',
//     roomId: '5354656522@chatroom',
//     timestamp: 1528657265,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   // console.log('payload:', event)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse room join message payload')
// })

// test('roomJoinEventMessageParser() ZH-other-invite-others', async t => {
//   t.skip('tbw')
// })

// test('roomJoinEventMessageParser() ZH-other-invite-bot', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"李佳芮"邀请你加入了群聊，群聊参与人还有：小桔、桔小秘、小小桔、wuli舞哩客服、舒米',
//     fromUser     : '8083065140@chatroom',
//     messageId    : '5158828327248760504',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1526984649,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }

//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU],
//     inviterName     : '李佳芮',
//     roomId          : '8083065140@chatroom',
//     timestamp       : 1526984649,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-other-invite-bot-with-other', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"李卓桓"邀请你和"Huan LI++"加入了群聊',
//     fromUser     : '5178377660@chatroom',
//     messageId    : '8563709618990948643',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528751621,
//     toUser       : 'wxid_a8d806dzznm822',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU, 'Huan LI++'],
//     inviterName     : '李卓桓',
//     roomId          : '5178377660@chatroom',
//     timestamp       : 1528751621,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-bot-invite-one', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '5354656522@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[你邀请"Huan LI++"加入了群聊  ]]></plain>\n\t\t<text><![CDATA[你邀请"Huan LI++"加入了群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_5zj4i5htp9ih22]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '5354656522@chatroom',
//     messageId    : '6278175026243694414',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528657265,
//     toUser       : 'lizhuohuan',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['Huan LI++'],
//     inviterName     : YOU,
//     roomId          : '5354656522@chatroom',
//     timestamp       : 1528657265,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// /**
//  * See more in https://github.com/lijiarui/wechaty-puppet-padchat/issues/55
//  */
// test('roomJoinEventMessageParser() ZH-bot-invite-three-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '6350854677@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[你邀请"李卓桓、李佳芮、桔小秘"加入了群聊  ]]></plain>\n\t\t<text><![CDATA[你邀请"李卓桓、李佳芮、桔小秘"加入了群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[lizhuohuan]]></username>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t\t<username><![CDATA[wxid_seytcj5hxxsh12]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '4060992149171432834',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528828692,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李卓桓', '李佳芮', '桔小秘'],
//     inviterName     : YOU,
//     roomId          : '6350854677@chatroom',
//     timestamp       : 1528828692,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-bot-invite-three-bot-is-not-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '12740017638@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[你邀请"卓桓、Zhuohuan、太阁_传话助手、桔小秘"加入了群聊  ]]></plain>\n\t\t<text><![CDATA[你邀请"卓桓、Zhuohuan、太阁_传话助手、桔小秘"加入了群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[lizhuohuan]]></username>\n\t\t\t\t<username><![CDATA[wxid_lredtm37y7rc22]]></username>\n\t\t\t\t<username><![CDATA[wxid_seytcj5hxxsh12]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '12740017638@chatroom',
//     messageId    : '7919516882221400792',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528829561,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓', 'Zhuohuan', '太阁_传话助手', '桔小秘'],
//     inviterName     : YOU,
//     roomId          : '12740017638@chatroom',
//     timestamp       : 1528829561,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-other-invite-bot-and-two', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"李佳芮-哈哈哈啊哈哈"邀请你加入了群聊，群聊参与人还有：小桔、桔小秘、太阁_传话助手、桔小秘',
//     fromUser     : '5616634434@chatroom',
//     messageId    : '4650121355699061443',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528830037,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU],
//     inviterName     : '李佳芮-哈哈哈啊哈哈',
//     roomId          : '5616634434@chatroom',
//     timestamp       : 1528830037,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-bot-when-bot-not-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '9967013206@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></plain>\n\t\t<text><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>qrcode</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t</memberlist>\n\t\t\t<qrcode><![CDATA[http: //weixin.qq.com/g/A3XRwu4O3KtmR1jc]]></qrcode>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '9967013206@chatroom',
//     messageId    : '4571828451143401319',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528830363,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李佳芮'],
//     inviterName     : YOU,
//     roomId          : '9967013206@chatroom',
//     timestamp       : 1528830363,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-bot-when-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '5616634434@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></plain>\n\t\t<text><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>qrcode</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t</memberlist>\n\t\t\t<qrcode><![CDATA[http: //weixin.qq.com/g/A7MgUgqtga7G9y03]]></qrcode>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '5616634434@chatroom',
//     messageId    : '3244658260828188781',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528830493,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李佳芮'],
//     inviterName     : YOU,
//     roomId          : '5616634434@chatroom',
//     timestamp       : 1528830493,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-other-when-bot-no-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '" 卓桓、Zhuohuan"通过扫描"李佳芮"分享的二维码加入群聊',
//     fromUser     : '9967013206@chatroom',
//     messageId    : '2518372397480881089',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528830692,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓', 'Zhuohuan'],
//     inviterName     : '李佳芮',
//     roomId          : '9967013206@chatroom',
//     timestamp       : 1528830692,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-other-when-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '" 卓桓、Zhuohuan"通过扫描"李佳芮"分享的二维码加入群聊',
//     fromUser     : '5616634434@chatroom',
//     messageId    : '2301570706114768273',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528830737,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓', 'Zhuohuan'],
//     inviterName     : '李佳芮',
//     roomId          : '5616634434@chatroom',
//     timestamp       : 1528830737,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() ZH-bot-invite-three', async t => {
//   t.skip('tbw')
// })

// test('roomJoinEventMessageParser() ZH-room-create', async t => {
//   t.skip('can not get create sys message, because room will not sync or appear before the creater send the first message')
// })

// test('roomJoinEventMessageParser() ZH-other-invite-other-with-emoji-in-name', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"XXX"邀请"<span class="emoji emoji1f338"></span>YYY"加入了群聊',
//     fromUser     : '5616634434@chatroom',
//     messageId    : '2301570706114768273',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528830737,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['<span class="emoji emoji1f338"></span>YYY'],
//     inviterName     : 'XXX',
//     roomId          : '5616634434@chatroom',
//     timestamp       : 1528830737,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })
