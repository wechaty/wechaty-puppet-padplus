import { payloads } from '@juzi/wechaty-puppet'

import {
  PadplusRoomPayload,
}                         from '../schemas'

export function roomRawPayloadParser (
  rawPayload: PadplusRoomPayload,
): payloads.Room {
  const payload: payloads.Room = {
    adminIdList  : [],
    avatar       : rawPayload.bigHeadUrl,
    id           : rawPayload.chatroomId,
    memberIdList : rawPayload.members.map(m => m.UserName) || [],
    ownerId      : rawPayload.chatRoomOwner,
    topic        : rawPayload.nickName,
  }

  return payload
}
