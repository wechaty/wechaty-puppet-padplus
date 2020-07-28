/* eslint-disable */
import { xmlToJson } from './xml-to-json'

import { YOU } from 'wechaty-puppet'

import {
  PadplusMessagePayload,
  RoomJoinEvent,
}                         from '../schemas'

import {
  isPayload,
  isRoomId,
}               from './is-type'

// import { log } from '../config'

/**
 *
 * 1. Room Join Event
 *
 *
 * try to find 'join' event for Room
 *
 * 1.
 *  李卓桓 invited Huan to the group chat
 *  李卓桓 invited 李佳芮, Huan to the group chat
 *  李卓桓 invited you to a group chat with
 *  李卓桓 invited you and Huan to the group chat
 * 2.
 *  "李卓桓"邀请"Huan LI++"加入了群聊
 *  "李佳芮"邀请你加入了群聊，群聊参与人还有：小桔、桔小秘、小小桔、wuli舞哩客服、舒米
 *  "李卓桓"邀请你和"Huan LI++"加入了群聊
 */

const ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_ZH = [
  /^你邀请"(.+)"加入了群聊 {2}\$revoke\$/,
  /^" ?(.+)"通过扫描你分享的二维码加入群聊/,
]

const ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_EN = [
  /^You invited (.+) to the group chat/,
  /^" ?(.+)" joined group chat via the QR code you shared/,
]

/* ----------------------------------------------- */

const ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_ZH = [
  /^"([^"]+?)"邀请你加入了群聊，群聊参与人还有：(.+)/,
]

const ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_EN = [
  /^(.+) invited you to a group chat with (.+)/,
]

/* ----------------------------------------------- */

const ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_ZH = [
  /^"(.+)"邀请"(.+)"加入了群聊/,
]

const ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_EN = [
  /^(.+?) invited (.+?) to (the|a) group chat/,
]

/* ----------------------------------------------- */

const ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_ZH = [
  /^" (.+)"通过扫描"(.+)"分享的二维码加入群聊/,
]

const ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_EN = [
  /^"(.+)" joined the group chat via the QR Code shared by "(.+)"/,
]

export async function roomJoinEventMessageParser (
  rawPayload: PadplusMessagePayload,
): Promise<null | RoomJoinEvent> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const roomId = rawPayload.fromUserName
  if (!roomId) {
    return null
  }
  if (!isRoomId(roomId)) {
    return null
  }

  const timestamp = rawPayload.createTime

  let content = rawPayload.content
  let linkList
  const tryXmlText = content.replace(/^[^\n]+\n/, '')

  interface XmlSchema {
    sysmsg: {
      $: {
        type: string,
      },
      sysmsgtemplate: {
        content_template: {
          $: {
            type: string,
          },
          plain: string,
          template: string,
          link_list: {
            link: [{
              $: {
                name: string,
                type: string,
                hidden?: string,
              },
              memberlist?: {
                member: [{
                  username: string,
                  nickname: string,
                }]
              },
              separator?: string,
              title?: string,
              usernamelist?: {
                username: string
              }
            }]
          }
        }
      }
    }
  }

  const jsonPayload: XmlSchema = await xmlToJson(tryXmlText) // toJson(tryXmlText, { object: true }) as XmlSchema
  content = jsonPayload.sysmsg.sysmsgtemplate.content_template.template
  linkList = jsonPayload.sysmsg.sysmsgtemplate.content_template.link_list.link

  /**
   * Process English language
   */
  let matchesForBotInviteOtherEn         = null as null | string[]
  let matchesForOtherInviteBotEn         = null as null | string[]
  let matchesForOtherInviteOtherEn       = null as null | string[]
  let matchesForOtherInviteOtherQrcodeEn = null as null | string[]

  ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_EN.some(
    regex => !!(matchesForBotInviteOtherEn = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_EN.some(
    regex => !!(matchesForOtherInviteBotEn = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_EN.some(
    regex => !!(matchesForOtherInviteOtherEn = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_EN.some(
    regex => !!(matchesForOtherInviteOtherQrcodeEn = content.match(regex)),
  )

  /**
   * Process Chinese language
   */
  let matchesForBotInviteOtherZh         = null as null | string[]
  let matchesForOtherInviteBotZh         = null as null | string[]
  let matchesForOtherInviteOtherZh       = null as null | string[]
  let matchesForOtherInviteOtherQrcodeZh = null as null | string[]

  ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_ZH.some(
    regex => !!(matchesForBotInviteOtherZh = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_ZH.some(
    regex => !!(matchesForOtherInviteBotZh = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_ZH.some(
    regex => !!(matchesForOtherInviteOtherZh = content.match(regex)),
  )
  ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_ZH.some(
    regex => !!(matchesForOtherInviteOtherQrcodeZh = content.match(regex)),
  )

  const matchesForBotInviteOther         = matchesForBotInviteOtherEn         || matchesForBotInviteOtherZh
  const matchesForOtherInviteBot         = matchesForOtherInviteBotEn         || matchesForOtherInviteBotZh
  const matchesForOtherInviteOther       = matchesForOtherInviteOtherEn       || matchesForOtherInviteOtherZh
  const matchesForOtherInviteOtherQrcode = matchesForOtherInviteOtherQrcodeEn || matchesForOtherInviteOtherQrcodeZh

  const matches =    matchesForBotInviteOther
                  || matchesForOtherInviteBot
                  || matchesForOtherInviteOther
                  || matchesForOtherInviteOtherQrcode

  if (!matches) {
    return null
  }

  /**
   * Parse all Names From the Event Text
   */
  if (matchesForBotInviteOther) {
    /**
     * 1. Bot Invite Other to join the Room
     *  (include invite via QrCode)
     */
    const other = matches[1]
    const inviteeIdList = getUserName(linkList, other)
    const inviterId: string | YOU = YOU
    const joinEvent: RoomJoinEvent = {
      inviteeIdList: checkString(inviteeIdList),
      inviterId,
      roomId,
      timestamp,
    }
    return joinEvent

  } else if (matchesForOtherInviteBot) {
    /**
     * 2. Other Invite Bot to join the Room
     */
    // /^"([^"]+?)"邀请你加入了群聊/,
    // /^"([^"]+?)"邀请你和"(.+?)"加入了群聊/,
    const _inviterName = matches[1]
    const inviterId = getUserName(linkList, _inviterName)
    let inviteeIdList: Array<string | YOU> = [ YOU ]

    const joinEvent: RoomJoinEvent = {
      inviteeIdList,
      inviterId,
      roomId,
      timestamp,
    }
    return joinEvent

  } else if (matchesForOtherInviteOther) {
    /**
     * 3. Other Invite Other to a Room
     *  (NOT include invite via Qrcode)
     */
    // /^"([^"]+?)"邀请"([^"]+)"加入了群聊$/,
    // /^([^"]+?) invited ([^"]+?) to (the|a) group chat/,
    const _inviterName = matches[1]
    const inviterId = getUserName(linkList, _inviterName)

    const _others = matches[2]
    const inviteeIdList = getUserName(linkList, _others)

    const joinEvent: RoomJoinEvent = {
      inviteeIdList: checkString(inviteeIdList),
      inviterId,
      roomId,
      timestamp,
    }
    return joinEvent

  } else if (matchesForOtherInviteOtherQrcode) {
    /**
     * 4. Other Invite Other via Qrcode to join a Room
     *   /^" (.+)"通过扫描"(.+)"分享的二维码加入群聊/,
     */
    const _inviterName = matches[2]
    const inviterId = getUserName(linkList, _inviterName)

    const other = matches[1]
    const inviteeIdList = getUserName(linkList, other)

    const joinEvent: RoomJoinEvent = {
      inviteeIdList: checkString(inviteeIdList),
      inviterId,
      roomId,
      timestamp,
    }
    return joinEvent

  } else {
    throw new Error('who invite who?')
  }
}

function checkString (inviteeIdList: string | string[]) {
  return typeof inviteeIdList !== 'string' ? inviteeIdList : [ inviteeIdList ]
}

function getUserName (linkList: any, name: string) {
  const otherObjectArray = linkList.filter((link: any) => name.includes(link.$.name))

  if (!otherObjectArray || otherObjectArray.length === 0) {
    return null
  }
  const otherObject = otherObjectArray[0]
  const inviteeList = otherObject.memberlist!.member

  const inviteeIdList = inviteeList.length ? inviteeList.map((i: any) => i.username) : (inviteeList as any).username
  return inviteeIdList
}
/*
const MESSAGE_PAYLOAD: PadplusMessagePayload = {
  // content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profilewithrevoke\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[你邀请\"$names$\"加入了群聊  $revoke$]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"names\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_3s4v7osfgpbc22]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[柠檬不酸]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t\t<separator><![CDATA[、]]></separator>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"revoke\" type=\"link_revoke\" hidden=\"1\">\n\t\t\t\t\t<title><![CDATA[撤销]]></title>\n\t\t\t\t\t<usernamelist>\n\t\t\t\t\t\t<username><![CDATA[wxid_3s4v7osfgpbc22]]></username>\n\t\t\t\t\t</usernamelist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
  content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profilewithrevoke\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[你邀请\"$names$\"加入了群聊  $revoke$]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"names\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_atjcz7dvaxn422]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[古根😄]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_rfd4l6310r3l12]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[小马爱生活]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_q0yib0cg8b2s22]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[小助手]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t\t<separator><![CDATA[、]]></separator>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"revoke\" type=\"link_revoke\" hidden=\"1\">\n\t\t\t\t\t<title><![CDATA[撤销]]></title>\n\t\t\t\t\t<usernamelist>\n\t\t\t\t\t\t<username><![CDATA[wxid_atjcz7dvaxn422]]></username>\n\t\t\t\t\t\t<username><![CDATA[wxid_rfd4l6310r3l12]]></username>\n\t\t\t\t\t\t<username><![CDATA[wxid_q0yib0cg8b2s22]]></username>\n\t\t\t\t\t</usernamelist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
  // content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\"$username$\"邀请你加入了群聊，群聊参与人还有：$others$]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"username\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[Soul001001]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[苏畅]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"others\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[古根😄、小马爱生活、小助手]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
  // content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\"$username$\"邀请你加入了群聊，群聊参与人还有：$others$]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"username\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[Soul001001]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[苏畅]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"others\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[古根😄、小助手]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
  // content: '20434481305@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\"$username$\"邀请\"$names$\"加入了群聊]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"username\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[Soul001001]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[苏畅]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"names\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_io10ga6dtjxe22]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[超酷爱宠]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t\t<separator><![CDATA[、]]></separator>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
  // content: '21524785272@chatroom:\n<sysmsg type=\"sysmsgtemplate\">\n\t<sysmsgtemplate>\n\t\t<content_template type=\"tmpl_type_profile\">\n\t\t\t<plain><![CDATA[]]></plain>\n\t\t\t<template><![CDATA[\" $adder$\"通过扫描\"$from$\"分享的二维码加入群聊]]></template>\n\t\t\t<link_list>\n\t\t\t\t<link name=\"adder\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_rdwh63c150bm12]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[小句子(佳芮助理机器人)]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t\t<link name=\"from\" type=\"link_profile\">\n\t\t\t\t\t<memberlist>\n\t\t\t\t\t\t<member>\n\t\t\t\t\t\t\t<username><![CDATA[wxid_atjcz7dvaxn422]]></username>\n\t\t\t\t\t\t\t<nickname><![CDATA[古根😄]]></nickname>\n\t\t\t\t\t\t</member>\n\t\t\t\t\t</memberlist>\n\t\t\t\t</link>\n\t\t\t</link_list>\n\t\t</content_template>\n\t</sysmsgtemplate>\n</sysmsg>\n',
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

async function main () {
  const result = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  console.log(`typeof result.inviteeIdList: ${typeof result!.inviteeIdList}`);
  console.log(`
  =====================
  result:
  ${JSON.stringify(result)}
  =====================
  `);
}

main() */
