/* eslint-disable sort-keys */
import { xmlToJson } from './xml-to-json'

import { payloads, types } from '@juzi/wechaty-puppet'

import {
  PadplusFriendshipPayload,
  PadplusMessagePayload,
}                                 from '../schemas'

import {
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
}                                         from './friendship-event-message-parser'

const friendshipTypeMap: { [scene: string]: types.FriendshipScene } = {
  '1': types.FriendshipScene.QQ,
  '2': types.FriendshipScene.Email,
  '3': types.FriendshipScene.Weixin,
  '12': types.FriendshipScene.QQtbd,
  '14': types.FriendshipScene.Room,
  '15': types.FriendshipScene.Phone,
  '17': types.FriendshipScene.Card,
  '18': types.FriendshipScene.Location,
  '25': types.FriendshipScene.Bottle,
  '29': types.FriendshipScene.Shaking,
  '30': types.FriendshipScene.QRCode,
}

export async function friendshipRawPayloadParser (
  rawPayload: PadplusMessagePayload,
) : Promise<payloads.Friendship> {

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
): Promise<payloads.Friendship> {
  const payload: payloads.FriendshipConfirm = {
    contactId : rawPayload.fromUserName,
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime,
    type      : types.Friendship.Confirm,
  }
  return payload
}

function friendshipRawPayloadParserVerify (
  rawPayload: PadplusMessagePayload,
): payloads.Friendship {
  const payload: payloads.FriendshipVerify = {
    contactId : rawPayload.fromUserName,
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime,
    type      : types.Friendship.Verify,
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

  const friendshipPayload: payloads.FriendshipReceive = {
    contactId : padplusFriendshipPayload.fromusername,
    hello     : padplusFriendshipPayload.content,
    id        : rawPayload.msgId,
    scene     : friendshipTypeMap[padplusFriendshipPayload.scene],
    stranger  : padplusFriendshipPayload.encryptusername,
    ticket    : padplusFriendshipPayload.ticket,
    timestamp : rawPayload.createTime,
    type      : types.Friendship.Receive,
  }

  return friendshipPayload
}
