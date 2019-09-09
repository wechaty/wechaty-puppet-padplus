import { xmlToJson } from './xml-to-json'

import {
  PadplusMessagePayload,
  PadplusRoomInviteEvent,
}                         from '../schemas'
import { isPayload } from './is-type'

/*
{
  "msg": {
    "appmsg": {
      "appid": "",
      "sdkver": "0",
      "title": "邀请你加入群聊",
      "des": "\"user\"邀请你加入群聊💃🏻这个群特别炸💃🏻，进入可查看详情。",
      "action": "view",
      "type": "5",
      "showtype": "0",
      "soundtype": "0",
      "mediatagname": {},
      "messageext": {},
      "messageaction": {},
      "content": {},
      "contentattr": "0",
      "url": "http://support.weixin.qq.com/cgi-bin/mmsupport-bin/addchatroombyinvite?ticket=AR4P8WARk7B55o05Gqc65Q%3D%3D",
      "lowurl": {},
      "dataurl": {},
      "lowdataurl": {},
      "appattach": {
        "totallen": "0",
        "attachid": {},
        "emoticonmd5": {},
        "fileext": {},
        "cdnthumbaeskey": {},
        "aeskey": {}
      },
      "extinfo": {},
      "sourceusername": {},
      "sourcedisplayname": {},
      "thumburl": "http://weixin.qq.com/cgi-bin/getheadimg?username=3085b869e7943882d94e05dcdc7f28c524804fc4759b6c273f2be799ed1bf0e9",
      "md5": {},
      "statextstr": {}
    },
    "fromusername": "lylezhuifeng",
    "scene": "0",
    "appinfo": {
      "version": "1",
      "appname": {}
    },
    "commenturl": {}
  }
}
*/

const ROOM_OTHER_INVITE_TITLE_ZH = [
  /邀请你加入群聊/,
]

const ROOM_OTHER_INVITE_TITLE_EN = [
  /Group Chat Invitation/,
]

const ROOM_OTHER_INVITE_LIST_ZH = [
  /^"(.+)"邀请你加入群聊(.+)，进入可查看详情。/,
]

const ROOM_OTHER_INVITE_LIST_EN = [
  /"(.+)" invited you to join the group chat "(.+)"\. Enter to view details\./,
]

export const roomInviteEventMessageParser = async (
  rawPayload: PadplusMessagePayload,
): Promise<null | PadplusRoomInviteEvent> => {

  if (!isPayload(rawPayload)) {
    return null
  }

  const { content, msgId, createTime, fromUserName } = rawPayload
  const tryXmlText = content.replace(/^[^\n]+\n/, '')
  interface XmlSchema {
    msg: {
      appmsg:
      {
        title: string,
        des: string,
        url: string,
        thumburl: string,
      },
      fromusername: string
    }
  }

  let jsonPayload: XmlSchema
  try {
    jsonPayload = await xmlToJson(tryXmlText) as XmlSchema
  } catch (e) {
    return null
  }

  // If no title or des, it is not a room invite event, skip further process

  if (!jsonPayload.msg || !jsonPayload.msg.appmsg || !jsonPayload.msg.appmsg.title || !jsonPayload.msg.appmsg.des
    // tslint:disable-next-line:strict-type-predicates
    || typeof jsonPayload.msg.appmsg.title !== 'string' ||  typeof jsonPayload.msg.appmsg.des !== 'string') {
    return null
  }

  let matchesForOtherInviteTitleEn = null as null | string[]
  let matchesForOtherInviteTitleZh = null as null | string[]
  let matchesForOtherInviteEn = null as null | string[]
  let matchesForOtherInviteZh = null as null | string[]

  ROOM_OTHER_INVITE_TITLE_EN.some(
    regex => !!(matchesForOtherInviteTitleEn = jsonPayload.msg.appmsg.title.match(regex)),
  )

  ROOM_OTHER_INVITE_TITLE_ZH.some(
    regex => !!(matchesForOtherInviteTitleZh = jsonPayload.msg.appmsg.title.match(regex)),
  )

  ROOM_OTHER_INVITE_LIST_EN.some(
    regex => !!(matchesForOtherInviteEn = jsonPayload.msg.appmsg.des.match(regex)),
  )

  ROOM_OTHER_INVITE_LIST_ZH.some(
    regex => !!(matchesForOtherInviteZh = jsonPayload.msg.appmsg.des.match(regex)),
  )

  const titleMatch = matchesForOtherInviteTitleEn || matchesForOtherInviteTitleZh

  const matchInviteEvent = matchesForOtherInviteEn || matchesForOtherInviteZh

  const matches = !!titleMatch && !!matchInviteEvent

  if (!matches) {
    return null
  }

  return {
    fromUser: fromUserName,
    msgId,
    roomName: matchInviteEvent![2],
    timestamp: createTime,
    url: jsonPayload.msg.appmsg.url,
  }
}
