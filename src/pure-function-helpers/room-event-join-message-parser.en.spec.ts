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

// test('roomJoinEventMessageParser() EN-other-invite-other', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '李卓桓 invited Huan to the group chat',
//     fromUser     : '5967138682@chatroom',
//     messageId    : '11101130790981890',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528754090,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['Huan'],
//     inviterName     : '李卓桓',
//     roomId          : '5967138682@chatroom',
//     timestamp       : 1528754090,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-other-invite-others', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '李卓桓 invited 李佳芮, Huan to the group chat',
//     fromUser     : '5178377660@chatroom',
//     messageId    : '3318447775079396781',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528752402,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李佳芮', 'Huan'],
//     inviterName     : '李卓桓',
//     roomId          : '5178377660@chatroom',
//     timestamp       : 1528752402,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-other-invite-bot', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '李卓桓 invited you to a group chat with ',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '6633562959389269859',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528653783,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU],
//     inviterName     : '李卓桓',
//     roomId          : '3453262102@chatroom',
//     timestamp       : 1528653783,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-other-invite-bot-with-2-others', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '李卓桓 invited you and Huan to the group chat',
//     fromUser     : '5178377660@chatroom',
//     messageId    : '3875534618008681721',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528751621,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU, 'Huan'],
//     inviterName     : '李卓桓',
//     roomId          : '5178377660@chatroom',
//     timestamp       : 1528751621,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-bot-invite-one', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '3453262102@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_a8d806dzznm822]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '4030118997146183783',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528755135,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }

//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['. 李 卓 桓 .呵呵'],
//     inviterName     : YOU,
//     roomId          : '3453262102@chatroom',
//     timestamp       : 1528755135,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// /**
//  * See more in https://github.com/lijiarui/wechaty-puppet-padchat/issues/55
//  */
// test('roomJoinEventMessageParser() EN-bot-invite-three-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '6350854677@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited 卓桓、Zhuohuan, 李佳芮, 太阁_传话助手 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited 卓桓、Zhuohuan, 李佳芮, 太阁_传话助手 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[lizhuohuan]]></username>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t\t<username><![CDATA[wxid_lredtm37y7rc22]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '8360809484132917423',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528831222,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓、Zhuohuan', '李佳芮', '太阁_传话助手'],
//     inviterName     : YOU,
//     roomId          : '6350854677@chatroom',
//     timestamp       : 1528831222,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-bot-invite-three-bot-is-not-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '12740017638@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited 卓桓、Zhuohuan, 太阁_传话助手, 桔小秘 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited 卓桓、Zhuohuan, 太阁_传话助手, 桔小秘 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[lizhuohuan]]></username>\n\t\t\t\t<username><![CDATA[wxid_lredtm37y7rc22]]></username>\n\t\t\t\t<username><![CDATA[wxid_seytcj5hxxsh12]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '12740017638@chatroom',
//     messageId    : '232220931339852872',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528831349,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓、Zhuohuan', '太阁_传话助手', '桔小秘'],
//     inviterName     : YOU,
//     roomId          : '12740017638@chatroom',
//     timestamp       : 1528831349,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-other-invite-bot-and-two', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '李佳芮 invited you to a group chat with 卓桓、Zhuohuan, 桔小秘, 桔小秘',
//     fromUser     : '12740017638@chatroom',
//     messageId    : '5536901313750622557',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528831519,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : [YOU],
//     inviterName     : '李佳芮',
//     roomId          : '12740017638@chatroom',
//     timestamp       : 1528831519,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-scan-qrcode-shared-by-bot-when-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '6350854677@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA["李佳芮" joined group chat via the QR code you shared.  ]]></plain>\n\t\t<text><![CDATA["李佳芮" joined group chat via the QR code you shared.  ]]></text>\n\t\t<link>\n\t\t\t<scene>qrcode</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t</memberlist>\n\t\t\t<qrcode><![CDATA[http: //weixin.qq.com/g/Ay3k_6_NZRM-0eGu]]></qrcode>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '4650182269246977858',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528831810,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李佳芮'],
//     inviterName     : YOU,
//     roomId          : '6350854677@chatroom',
//     timestamp       : 1528831810,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-scan-qrcode-shared-by-bot-when-bot-not-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '9967013206@chatroom: \n<sysmsg type = "delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></plain>\n\t\t<text><![CDATA["李佳芮"通过扫描你分享的二维码加入群聊  ]]></text>\n\t\t<link>\n\t\t\t<scene>qrcode</scene>\n\t\t\t<text><![CDATA[  撤销]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[qq512436430]]></username>\n\t\t\t</memberlist>\n\t\t\t<qrcode><![CDATA[http: //weixin.qq.com/g/A_bp7kz2nCsWWNW7]]></qrcode>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     fromUser     : '9967013206@chatroom',
//     messageId    : '387789779973392581',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528831949,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['李佳芮'],
//     inviterName     : YOU,
//     roomId          : '9967013206@chatroom',
//     timestamp       : 1528831949,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-scan-qrcode-shared-by-other-when-bot-is-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"卓桓、Zhuohuan" joined the group chat via the QR Code shared by "李佳芮".',
//     fromUser     : '5616634434@chatroom',
//     messageId    : '4922578438277818474',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528831993,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓、Zhuohuan'],
//     inviterName     : '李佳芮',
//     roomId          : '5616634434@chatroom',
//     timestamp       : 1528831993,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-scan-qrcode-shared-by-other-when-bot-no-owner', async t => {
//   const MESSAGE_PAYLOAD: PadplusMessagePayload = {
//     content      : '"卓桓、Zhuohuan" joined the group chat via the QR Code shared by "李佳芮".',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '6329592305165976988',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1528832169,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }
//   const EXPECTED_EVENT: PuppetRoomJoinEvent = {
//     inviteeNameList : ['卓桓、Zhuohuan'],
//     inviterName     : '李佳芮',
//     roomId          : '6350854677@chatroom',
//     timestamp       : 1528832169,
//   }

//   const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
//   t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
// })

// test('roomJoinEventMessageParser() EN-bot-invite-many', async t => {
//   t.skip('should be the same as the bot-invite-many')
// })

// test('roomJoinEventMessageParser() EN-room-create', async t => {
//   t.skip('to be confirm')
// })
