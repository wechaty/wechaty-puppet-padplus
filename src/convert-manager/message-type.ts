import {
  MessageType,
}                         from 'wechaty-puppet'

import {
  MacproMessageType,
}                         from '../schemas'

export function messageType (
  rawType: MacproMessageType,
): MessageType {
  let type: MessageType

  switch (rawType) {

    case MacproMessageType.Text:
      type = MessageType.Text
      break

    case MacproMessageType.Image:
      type = MessageType.Image
      // console.log(rawPayload)
      break

    case MacproMessageType.Voice:
      type = MessageType.Audio
      // console.log(rawPayload)
      break

    case MacproMessageType.Emoji:
    case MacproMessageType.Gif:
      type = MessageType.Emoticon
      // console.log(rawPayload)
      break

    case MacproMessageType.File:
      type = MessageType.Attachment
      // console.log(rawPayload)
      break

    case MacproMessageType.Location:
      type = MessageType.Location
      // console.log(rawPayload)
      break

    case MacproMessageType.Video:
      type = MessageType.Video
      // console.log(rawPayload)
      break

    case MacproMessageType.System:
      type = MessageType.Unknown
      break

    case MacproMessageType.PublicCard:
      type = MessageType.Contact
      break

    case MacproMessageType.PrivateCard:
      type = MessageType.Contact
      break

    case MacproMessageType.RedPacket:
    case MacproMessageType.MoneyTransaction:
      type = MessageType.Money
      break

    case MacproMessageType.MiniProgram:
      type = MessageType.MiniProgram
      break

    case MacproMessageType.UrlLink:
      type = MessageType.Url
      break

    default:
      throw new Error('unsupported type: ' + MacproMessageType[rawType] + '(' + rawType + ')')
  }

  return type
}
