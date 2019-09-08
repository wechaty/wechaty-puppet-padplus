import {
  MessageType,
}                         from 'wechaty-puppet'

import {
  PadplusMessageType,
}                         from '../schemas'

export function messageType (
  rawType: PadplusMessageType,
): MessageType {
  let type: MessageType

  switch (rawType) {

    case PadplusMessageType.Text:
      type = MessageType.Text
      break

    case PadplusMessageType.Image:
      type = MessageType.Image
      // console.log(rawPayload)
      break

    case PadplusMessageType.Voice:
      type = MessageType.Audio
      // console.log(rawPayload)
      break

    case PadplusMessageType.Emoji:
    case PadplusMessageType.Gif:
      type = MessageType.Emoticon
      // console.log(rawPayload)
      break

    case PadplusMessageType.File:
      type = MessageType.Attachment
      // console.log(rawPayload)
      break

    case PadplusMessageType.Location:
      type = MessageType.Location
      // console.log(rawPayload)
      break

    case PadplusMessageType.Video:
      type = MessageType.Video
      // console.log(rawPayload)
      break

    case PadplusMessageType.Sys:
      type = MessageType.Unknown
      break

    case PadplusMessageType.ShareCard:
      type = MessageType.Contact
      break

    case PadplusMessageType.Contact:
      type = MessageType.Contact
      break

    default:
      throw new Error('unsupported type: ' + PadplusMessageType[rawType] + '(' + rawType + ')')
  }

  return type
}
