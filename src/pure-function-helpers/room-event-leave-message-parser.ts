import {
  PadplusMessagePayload,
  RoomLeaveEvent,
  RoomRelatedXmlSchema,
}                         from '../schemas'

import {
  isPayload,
  isRoomId,
}               from './is-type'
import { YOU } from 'wechaty-puppet'
import { xmlToJson } from './xml-to-json'
import { getUserName } from './get-xml-label'
import { log } from '../config'

/**
 *
 * 2. Room Leave Event
 *
 *
 * try to find 'leave' event for Room
 *
 * 1.
 *  You removed "李卓桓" from the group chat
 *  You were removed from the group chat by "李卓桓"
 * 2.
 *  你将"Huan LI++"移出了群聊
 *  你被"李卓桓"移出群聊
 */

const ROOM_LEAVE_OTHER_REGEX_LIST = [
  /^(You) removed "(.+)" from the group chat/,
  /^(你)将"(.+)"移出了群聊/,
]

const ROOM_LEAVE_BOT_REGEX_LIST = [
  /^(You) were removed from the group chat by "([^"]+)"/,
  /^(你)被"([^"]+?)"移出群聊/,
]

export async function roomLeaveEventMessageParser (
  rawPayload: PadplusMessagePayload,
): Promise<null | RoomLeaveEvent> {

  log.silly(`rawPayload: ${JSON.stringify(rawPayload)}`)
  if (!isPayload(rawPayload)) {
    return null
  }

  const roomId  = rawPayload.fromUserName
  const timestamp = rawPayload.createTime

  let content = rawPayload.content
  if (!content) {
    return null
  }
  let linkList

  let needParseXML = content.includes('移出群聊') || content.includes('You were removed from the group chat by')
  if (!needParseXML) {
    const tryXmlText = content.replace(/^[^\n]+\n/, '')
    const jsonPayload: RoomRelatedXmlSchema = await xmlToJson(tryXmlText) // toJson(tryXmlText, { object: true }) as RoomRelatedXmlSchema
    if (!jsonPayload) {
      return null
    }
    content = jsonPayload.sysmsg.sysmsgtemplate.content_template.template
    linkList = jsonPayload.sysmsg.sysmsgtemplate.content_template.link_list.link
  }

  if (!roomId) {
    return null
  }
  if (!isRoomId(roomId)) {
    return null
  }

  let matchesForOther: null | string[] = []
  ROOM_LEAVE_OTHER_REGEX_LIST.some(
    regex => !!(
      matchesForOther = content.match(regex)
    ),
  )

  let matchesForBot: null | string[] = []
  ROOM_LEAVE_BOT_REGEX_LIST.some(
    re => !!(
      matchesForBot = content.match(re)
    ),
  )

  const matches = matchesForOther || matchesForBot
  if (!matches) {
    return null
  }

  let leaverId  : string | YOU
  let removerId : string | YOU

  if (matchesForOther) {
    removerId = YOU
    const leaverName  = matchesForOther[2]
    leaverId  = getUserName([linkList], leaverName)
  } else if (matchesForBot) {
    removerId = matchesForBot[2]
    leaverId  = YOU
  } else {
    throw new Error('for typescript type checking, will never go here')
  }

  const roomLeaveEvent: RoomLeaveEvent = {
    leaverIdList  : [leaverId],
    removerId,
    roomId,
    timestamp,
  }
  return roomLeaveEvent
}
