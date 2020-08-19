/* eslint-disable */
import { xmlToJson } from './xml-to-json'

import { YOU } from 'wechaty-puppet'

import {
  PadplusMessagePayload,
  RoomJoinEvent,
  RoomRelatedXmlSchema,
}                         from '../schemas'

import {
  isPayload,
  isRoomId,
}               from './is-type'
import { getUserName } from './get-xml-label'

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

  const jsonPayload: RoomRelatedXmlSchema = await xmlToJson(tryXmlText) // toJson(tryXmlText, { object: true }) as RoomRelatedXmlSchema

  if (!jsonPayload || !jsonPayload.sysmsg || jsonPayload.sysmsg.$.type !== 'sysmsgtemplate') {
    return null
  }

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