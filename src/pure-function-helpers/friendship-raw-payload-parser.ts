/* eslint-disable sort-keys */
import { xmlToJson } from './xml-to-json'

import {
  FriendshipType,
  FriendshipPayload,
  FriendshipPayloadConfirm,
  FriendshipPayloadReceive,
  FriendshipPayloadVerify,
  FriendshipSceneType,
} from 'wechaty-puppet'

import {
  PadplusFriendshipPayload,
  PadplusMessagePayload,
}                                 from '../schemas'

import {
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
}                                         from './friendship-event-message-parser'

const friendshipTypeMap: { [scene: string]: FriendshipSceneType } = {
  '1': FriendshipSceneType.QQ,
  '2': FriendshipSceneType.Email,
  '3': FriendshipSceneType.Weixin,
  '12': FriendshipSceneType.QQtbd,
  '14': FriendshipSceneType.Room,
  '15': FriendshipSceneType.Phone,
  '17': FriendshipSceneType.Card,
  '18': FriendshipSceneType.Location,
  '25': FriendshipSceneType.Bottle,
  '29': FriendshipSceneType.Shaking,
  '30': FriendshipSceneType.QRCode,
}

export async function friendshipRawPayloadParser (
  rawPayload: PadplusMessagePayload,
) : Promise<FriendshipPayload> {

  if (friendshipConfirmEventMessageParser(rawPayload)) {
    /**
     * 1. Confirm Event
     */
    return friendshipRawPayloadParserConfirm(rawPayload)

  } else if (friendshipVerifyEventMessageParser(rawPayload)) {
    /**
     * 2. Verify Event
     */
    return friendshipRawPayloadParserVerify(rawPayload)

  } else if (await friendshipReceiveEventMessageParser(rawPayload)) {
    /**
     * 3. Receive Event
     */
    return friendshipRawPayloadParserReceive(rawPayload)

  } else {
    throw new Error('event type is neither confirm nor verify, and not receive')
  }
}

async function friendshipRawPayloadParserConfirm (
  rawPayload: PadplusMessagePayload,
): Promise<FriendshipPayload> {
  const payload: FriendshipPayloadConfirm = {
    contactId : rawPayload.fromUserName,
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime,
    type      : FriendshipType.Confirm,
  }
  return payload
}

function friendshipRawPayloadParserVerify (
  rawPayload: PadplusMessagePayload,
): FriendshipPayload {
  const payload: FriendshipPayloadVerify = {
    contactId : rawPayload.fromUserName,
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime,
    type      : FriendshipType.Verify,
  }
  return payload
}

async function friendshipRawPayloadParserReceive (
  rawPayload: PadplusMessagePayload,
) {
  const tryXmlText = rawPayload.content

  interface XmlSchema {
    msg?: {
      $: PadplusFriendshipPayload,
    },
  }

  const jsonPayload: XmlSchema = await xmlToJson(tryXmlText) // , { object: true })

  if (!jsonPayload.msg) {
    throw new Error('no msg found')
  }
  const padplusFriendshipPayload: PadplusFriendshipPayload = jsonPayload.msg.$

  const friendshipPayload: FriendshipPayloadReceive = {
    contactId : padplusFriendshipPayload.fromusername,
    hello     : padplusFriendshipPayload.content,
    id        : rawPayload.msgId,
    scene     : friendshipTypeMap[padplusFriendshipPayload.scene],
    stranger  : padplusFriendshipPayload.encryptusername,
    ticket    : padplusFriendshipPayload.ticket,
    timestamp : rawPayload.createTime,
    type      : FriendshipType.Receive,
  }

  return friendshipPayload
}
