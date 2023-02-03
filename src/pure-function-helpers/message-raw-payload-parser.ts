import { payloads, types } from '@juzi/wechaty-puppet'

import {
  PadplusMessagePayload,
  WechatAppMessageType,
}                         from '../schemas'

import {
  isContactId,
  isIMRoomId,
  isRoomId,
}                         from './is-type'

import { appMessageParser } from '.'
import { messageFileName } from './message-file-name'
import { recalledPayloadParser } from './message-recalled-payload-parser'
import { messageSourceParser } from './message-source-parser'
import { messageType } from './message-type'
import { log } from '../config'
import { quotePayloadParser } from './message-quote-payload-parser'

const PRE = 'messageRawPayloadParser'

export async function messageRawPayloadParser (
  rawPayload: PadplusMessagePayload,
): Promise<payloads.Message> {

  /**
   * 0. Set Message Type
   */
  const type = messageType(rawPayload.msgType)
  log.silly(PRE, `messageType ${type}`)

  const payloadBase = {
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime,
    type,
  } as {
    id        : string,
    timestamp : number,
    type      : types.Message,
    filename? : string,
    url?      : string,
  }

  if (type === types.Message.Image
      || type === types.Message.Audio
      || type === types.Message.Video
      || type === types.Message.Attachment
  ) {
    payloadBase.filename = messageFileName(rawPayload) || undefined
  }

  if (type === types.Message.Emoticon) {
    payloadBase.url = rawPayload.url
  }

  let talkerId: undefined | string
  let roomId: undefined | string
  let receiverId:   undefined | string

  let text:   undefined | string

  let mentionIdList: string[] = []

  /**
   * 1. Set Room Id
   */
  if (isRoomId(rawPayload.fromUserName)) {
    roomId = rawPayload.fromUserName
  } else if (isRoomId(rawPayload.toUserName)) {
    roomId = rawPayload.toUserName
  } else if (isIMRoomId(rawPayload.fromUserName)) {
    roomId = rawPayload.fromUserName
  } else if (isIMRoomId(rawPayload.toUserName)) {
    roomId = rawPayload.toUserName
  } else {
    roomId = undefined
  }

  /**
   * 2. Set To Contact Id
   */
  if (isContactId(rawPayload.toUserName)) {

    receiverId = rawPayload.toUserName

  } else {
    // TODO: if the message @someone, the toId should set to the mentioned contact id(?)

    receiverId = undefined

  }

  /**
   * 3. Set From Contact Id
   */
  if (isContactId(rawPayload.fromUserName)) {

    talkerId = rawPayload.fromUserName

  } else {
    const parts = rawPayload.content.split(':\n')
    if (parts && parts.length > 1) {
      if (isContactId(parts[0])) {

        talkerId = parts[0]

      }
    } else {

      talkerId = undefined

    }
  }

  /**
   *
   * 4. Set Text
   */
  if (isRoomId(rawPayload.fromUserName)) {

    const startIndex = rawPayload.content.indexOf(':\n')

    text = rawPayload.content.slice(startIndex !== -1 ? startIndex + 2 : 0)

  } else if (isContactId(rawPayload.fromUserName)) {

    text = rawPayload.content

  }

  if (type === types.Message.Recalled) {

    const recalledPayload = await recalledPayloadParser(rawPayload)
    const pattern = [
      /"(.+)" 撤回了一条消息/,
      /"(.+)" recalled a message/,
    ]
    const patternSelf = [
      /你撤回了一条消息/,
      /You recalled a message/,
    ]
    if (recalledPayload) {
      const isRecalled = pattern.some(regex => regex.test(recalledPayload.replaceMsg))
      const isRecalledSelf = patternSelf.some(regex => regex.test(recalledPayload.replaceMsg))
      if (isRecalled || isRecalledSelf) {
        text = recalledPayload.newMsgId
        if (isRecalledSelf) {
          talkerId = rawPayload.toUserName
          if (isRoomId(rawPayload.fromUserName)) {
            roomId = rawPayload.fromUserName
          } else if (isContactId(rawPayload.fromUserName)) {
            receiverId = rawPayload.fromUserName
          }
        }
      } else {
        payloadBase.type = types.Message.Unknown
      }
    } else {
      payloadBase.type = types.Message.Unknown
    }

  }

  /**
   * 5.1 Validate Room & From ID
   */
  if (!roomId && !talkerId) {
    throw Error('empty roomId and empty talkerId!')
  }
  /**
   * 5.1 Validate Room & To ID
   */
  if (!roomId && !receiverId) {
    throw Error('empty roomId and empty toId!')
  }

  /**
   * 6. Set mention list, only for room messages
   */
  if (roomId) {
    const messageSource = await messageSourceParser(rawPayload.msgSource)
    if (messageSource !== null && messageSource.atUserList) {
      mentionIdList = messageSource.atUserList || []
    }
  }

  /**
   * 7. Set text for quote message
   */
  if (rawPayload.appMsgType === WechatAppMessageType.QuoteMessage) {
    text = await quotePayloadParser(rawPayload)
  }

  let payload: payloads.Message

  // Two branch is the same code.
  // Only for making TypeScript happy
  if (talkerId && receiverId) {
    payload = {
      ...payloadBase,
      mentionIdList,
      roomId: roomId!,
      talkerId,
      text,
      toId: receiverId,
    }
  } else if (roomId) {
    payload = {
      ...payloadBase,
      mentionIdList,
      roomId,
      talkerId: talkerId!,
      text,
      toId: receiverId,
    }
  } else {
    throw new Error('neither toId nor roomId')
  }

  /**
   * 6. Set app payload type
   */
  if (type === types.Message.Attachment) {
    const appPayload = await appMessageParser(rawPayload)
    if (appPayload) {
      switch (appPayload.type) {
        case WechatAppMessageType.Text:
          payload.type = types.Message.Text
          payload.text = appPayload.title
          payload.filename = undefined
          break
        case WechatAppMessageType.Url:
          payload.type = types.Message.Url
          break
        case WechatAppMessageType.Attach:
          payload.type = types.Message.Attachment
          payload.filename = appPayload.title
          break
        case WechatAppMessageType.ChatHistory:
          payload.type = types.Message.ChatHistory
          break
        case WechatAppMessageType.MiniProgram:
        case WechatAppMessageType.MiniProgramApp:
          payload.type = types.Message.MiniProgram
          break
        case WechatAppMessageType.RedEnvelopes:
          payload.type = types.Message.RedEnvelope
          break
        case WechatAppMessageType.Transfers:
          payload.type = types.Message.Transfer
          break
        case WechatAppMessageType.RealtimeShareLocation:
          payload.type = types.Message.Location
          break
        case WechatAppMessageType.GroupNote:
          payload.type = types.Message.GroupNote
          payload.text = appPayload.title
          break
        case WechatAppMessageType.QuoteMessage:
          payload.type = types.Message.Text
          break
        default:
          payload.type = types.Message.Unknown
          break
      }
    }
  }

  return payload
}
