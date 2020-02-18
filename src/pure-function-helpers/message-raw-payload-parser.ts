import {
  MessagePayload,
  MessageType,
}                         from 'wechaty-puppet'

import {
  PadplusMessagePayload,
  WechatAppMessageType,
}                         from '../schemas'

import {
  isContactId,
  isRoomId,
}                         from './is-type'

import { appMessageParser } from '.'
import { messageFileName } from './message-file-name'
import { recalledPayloadParser } from './message-recalled-payload-parser'
import { messageSourceParser } from './message-source-parser'
import { messageType } from './message-type'
import { log } from '../config'
// import { xmlToJson } from './xml-to-json'

const PRE = 'messageRawPayloadParser'

export async function messageRawPayloadParser (
  rawPayload: PadplusMessagePayload,
): Promise<MessagePayload> {

  // console.log('messageRawPayloadParser:', rawPayload)

  /**
   * 0. Set Message Type
   */
  const type = messageType(rawPayload.msgType)
  log.silly(PRE, `messageType ${type}`)

  const payloadBase = {
    id        : rawPayload.msgId,
    timestamp : rawPayload.createTime / 1000,   // Padplus message timestamp is seconds
    type,
  } as {
    id        : string,
    timestamp : number,
    type      : MessageType,
    filename? : string,
    url?      : string,
  }

  if (type === MessageType.Image
      || type === MessageType.Audio
      || type === MessageType.Video
      || type === MessageType.Attachment
  ) {
    payloadBase.filename = messageFileName(rawPayload) || undefined
  }

  if (type === MessageType.Emoticon) {
    payloadBase.url = rawPayload.url
  }

  let fromId: undefined | string
  let roomId: undefined | string
  let toId:   undefined | string

  let text:   undefined | string

  let mentionIdList: string[] = []

  /**
   * 1. Set Room Id
   */
  if (isRoomId(rawPayload.fromUserName)) {
    roomId = rawPayload.fromUserName
  } else if (isRoomId(rawPayload.toUserName)) {
    roomId = rawPayload.toUserName
  } else {
    roomId = undefined
  }

  /**
   * 2. Set To Contact Id
   */
  if (isContactId(rawPayload.toUserName)) {

    toId = rawPayload.toUserName

  } else {
    // TODO: if the message @someone, the toId should set to the mentioned contact id(?)

    toId = undefined

  }

  /**
   * 3. Set From Contact Id
   */
  if (isContactId(rawPayload.fromUserName)) {

    fromId = rawPayload.fromUserName

  } else {
    const parts = rawPayload.content.split(':\n')
    if (parts && parts.length > 1) {
      if (isContactId(parts[0])) {

        fromId = parts[0]

      }
    } else {

      fromId = undefined

    }
  }

  /**
   *
   * 4. Set Text
   */
  if (isRoomId(rawPayload.fromUserName)) {

    const startIndex = rawPayload.content.indexOf(':\n')

    text = rawPayload.content.slice(startIndex !== -1 ? startIndex + 2 : 0)

  } else {

    text = rawPayload.content

  }

  if (type === MessageType.Recalled) {

    const recalledPayload = await recalledPayloadParser(rawPayload)
    const pattern = [
      /"(.+)" 撤回了一条消息/,
      /"(.+)" has recalled a message./,
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
          fromId = rawPayload.toUserName
          if (isRoomId(rawPayload.fromUserName)) {
            roomId = rawPayload.fromUserName
          } else if (isContactId(rawPayload.fromUserName)) {
            toId = rawPayload.fromUserName
          }
        }
      } else {
        payloadBase.type = MessageType.Unknown
      }
    } else {
      payloadBase.type = MessageType.Unknown
    }

  }

  /**
   * 5.1 Validate Room & From ID
   */
  if (!roomId && !fromId) {
    throw Error('empty roomId and empty fromId!')
  }
  /**
   * 5.1 Validate Room & To ID
   */
  if (!roomId && !toId) {
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
   * 6. Set Contact for ShareCard
   */
  /* if (type === MessageType.Contact) {
    const xml = await xmlToJson(rawPayload.content.split('\n')[1])
    log.silly(PRE, `xml : ${JSON.stringify(xml)}`)
    const shareCardData = xml.msg.$
    text = JSON.stringify(shareCardData)
  } */

  let payload: MessagePayload

  // Two branch is the same code.
  // Only for making TypeScript happy
  if (fromId && toId) {
    payload = {
      ...payloadBase,
      fromId,
      mentionIdList,
      roomId,
      text,
      toId,
    }
  } else if (roomId) {
    payload = {
      ...payloadBase,
      fromId,
      mentionIdList,
      roomId,
      text,
      toId,
    }
  } else {
    throw new Error('neither toId nor roomId')
  }

  /**
   * 6. Set app payload type
   */
  if (type === MessageType.Attachment) {
    const appPayload = await appMessageParser(rawPayload)
    if (appPayload) {
      switch (appPayload.type) {
        case WechatAppMessageType.Text:
          payload.type = MessageType.Text
          payload.text = appPayload.title
          payload.filename = undefined
          break
        case WechatAppMessageType.Url:
          payload.type = MessageType.Url
          break
        case WechatAppMessageType.Attach:
          payload.type = MessageType.Attachment
          payload.filename = appPayload.title
          break
        case WechatAppMessageType.ChatHistory:
          payload.type = MessageType.ChatHistory
          break
        case WechatAppMessageType.MiniProgram:
        case WechatAppMessageType.MiniProgramApp:
          payload.type = MessageType.MiniProgram
          break
        case WechatAppMessageType.RedEnvelopes:
          payload.type = MessageType.RedEnvelope
          break
        case WechatAppMessageType.Transfers:
          payload.type = MessageType.Transfer
          break
        case WechatAppMessageType.RealtimeShareLocation:
          payload.type = MessageType.Location
          break

        default:
          payload.type = MessageType.Unknown
          break
      }
    }
  }

  return payload
}
