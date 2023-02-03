import { types } from '@juzi/wechaty-puppet'

import {
  PadplusMessageType,
}                         from '../schemas'

export function messageType (
  rawType: PadplusMessageType,
): types.Message {
  let type: types.Message

  switch (rawType) {

    case PadplusMessageType.Text:
      type = types.Message.Text
      break

    case PadplusMessageType.Image:
      type = types.Message.Image
      // console.log(rawPayload)
      break

    case PadplusMessageType.Voice:
      type = types.Message.Audio
      // console.log(rawPayload)
      break

    case PadplusMessageType.Emoticon:
      type = types.Message.Emoticon
      // console.log(rawPayload)
      break

    case PadplusMessageType.App:
      type = types.Message.Attachment
      // console.log(rawPayload)
      break

    case PadplusMessageType.Location:
      type = types.Message.Location
      // console.log(rawPayload)
      break

    case PadplusMessageType.Video:
      type = types.Message.Video
      // console.log(rawPayload)
      break

    case PadplusMessageType.Sys:
      type = types.Message.Unknown
      break

    case PadplusMessageType.ShareCard:
      type = types.Message.Contact
      break

    case PadplusMessageType.VoipMsg:
    case PadplusMessageType.Recalled:
      type = types.Message.Recalled
      break

    case PadplusMessageType.StatusNotify:
    case PadplusMessageType.SysNotice:
      type = types.Message.Unknown
      break

    default:
      throw new Error('unsupported type: ' + PadplusMessageType[rawType] + '(' + rawType + ')')
  }

  return type
}
