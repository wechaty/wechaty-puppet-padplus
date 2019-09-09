import { xmlToJson } from './xml-to-json'

import { FriendshipType } from 'wechaty-puppet'

import {
  FriendshipPayload,
  FriendshipPayloadConfirm,
  FriendshipPayloadReceive,
  FriendshipPayloadVerify,
  PadplusFriendshipPayload,
  PadplusMessagePayload,
}                                 from '../schemas'

import {
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
}                                         from './friendship-event-message-parser'

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
  const padchatFriendshipPayload: PadplusFriendshipPayload = jsonPayload.msg.$

  const friendshipPayload: FriendshipPayloadReceive = {
    contactId : padchatFriendshipPayload.fromusername,
    hello     : padchatFriendshipPayload.content,
    id        : rawPayload.msgId,
    stranger  : padchatFriendshipPayload.encryptusername,
    ticket    : padchatFriendshipPayload.ticket,
    timestamp : rawPayload.createTime,
    type      : FriendshipType.Receive,
  }

  return friendshipPayload
}
