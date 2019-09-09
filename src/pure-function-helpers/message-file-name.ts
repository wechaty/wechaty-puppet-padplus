import {
  PadplusMessagePayload, PadplusMessageType,
}                               from '../schemas'

export function messageFileName (
  rawPayload: PadplusMessagePayload,
): string {
  if (rawPayload.msgType === PadplusMessageType.Voice) {
    return rawPayload.msgId + '.slk'
  } else if (rawPayload.msgType === PadplusMessageType.Image) {
    return rawPayload.msgId + '.jpg'
  } else if (rawPayload.msgType === PadplusMessageType.Video) {
    return rawPayload.msgId + '.mp4'
  }

  return rawPayload.msgId + '-to-be-implement.txt'
}
