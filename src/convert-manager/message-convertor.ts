import { PadplusMessagePayload, GrpcMessagePayload } from "../schemas/model-message";
import {
  MessagePayload,
  MessageType,
}                         from 'wechaty-puppet'

import {
  MessageSendType, PadplusMessageType,
}                         from '../schemas'

import {
  isRoomId,
}                         from './is-type'

import { messageType } from './message-type'
import { log } from '../config'
import { async } from "rxjs/internal/scheduler/async";

const PRE = 'messageRawPayloadParser'

export async function convertMessageFromPadplusToPuppet (
  rawPayload: PadplusMessagePayload,
): Promise<MessagePayload> {

  // console.log('messageRawPayloadParser:', rawPayload)

  /**
   * 0. Set Message Type
   */
  const type = messageType(rawPayload.content_type)
  log.silly(PRE, `messageType ${type}`)

  const payloadBase = {
    id        : rawPayload.messageId,
    timestamp : rawPayload.timestamp,   // Padchat message timestamp is seconds
    type,
  } as {
    id        : string,
    timestamp : number,
    type      : MessageType,
    filename? : string,
  }

  let fromId: undefined | string
  let roomId: undefined | string
  let toId:   undefined | string

  let text:   undefined | string

  let mentionIdList: string[] = []

  /**
   * 1. Set Room Id
   */
  if (isRoomId(rawPayload.g_number)) {
    roomId = rawPayload.g_number
  } else {
    roomId = undefined
  }

  /**
   * 2. Set To Contact Id
   */
  if (rawPayload.type === MessageSendType.SELF_SENT) {

    toId = rawPayload.to_account_alias || rawPayload.to_account

  } else if (rawPayload.type === MessageSendType.CONTACT_SENT) {
    // TODO: if the message @someone, the toId should set to the mentioned contact id(?)

    toId = rawPayload.my_account_alias || rawPayload.my_account

  }

  /**
   * 3. Set From Contact Id
   */
  if (rawPayload.type === MessageSendType.SELF_SENT) {

    fromId = rawPayload.my_account_alias || rawPayload.my_account

  } else {

    fromId = rawPayload.to_account_alias || rawPayload.to_account

  }

  /**
   *
   * 4. Set Text
   */
  if (rawPayload.g_number) {

    const startIndex = rawPayload.content.indexOf(':\n')

    text = rawPayload.content.slice(startIndex !== -1 ? startIndex + 2 : 0)

  } else {

    text = rawPayload.content

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
   * TODO: currently not available
   */
  // if (roomId) {
  //   const messageSource = await messageSourceParser(rawPayload.messageSource)
  //   if (messageSource !== null && messageSource.atUserList) {
  //     mentionIdList = messageSource.atUserList
  //   }
  // }

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

  return payload
}

export async function convertMessageFromGrpcToPadplus (rawMessage: GrpcMessagePayload): Promise<PadplusMessagePayload> {
  const messagePayload: PadplusMessagePayload = {
    appMsgType: rawMessage.AppMsgType,
    content: rawMessage.Content,
    createTime: rawMessage.CreateTime,
    fileName: rawMessage.FileName || rawMessage.fileName,
    fromMemberNickName: rawMessage.FromMemberNickName,
    fromMemberUserName: rawMessage.FromMemberUserName,
    fromUserName: rawMessage.FromUserName,
    imgBuf: rawMessage.ImgBuf,
    imgStatus: rawMessage.ImgStatus,
    l1MsgType: rawMessage.L1MsgType,
    msgId: rawMessage.MsgId,
    msgSource: rawMessage.MsgSource,
    msgSourceCd: rawMessage.msgSourceCd,
    msgType: rawMessage.MsgType as PadplusMessageType,
    newMsgId: rawMessage.NewMsgId,
    pushContent: rawMessage.PushContent,
    status: rawMessage.Status,
    toUserName: rawMessage.ToUserName,
    uin: rawMessage.Uin,
    url: rawMessage.Url,
    wechatUserName: rawMessage.wechatUserName,
  }
  return messagePayload
}