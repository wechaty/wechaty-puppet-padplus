import {
  RoomPayload,
}                   from 'wechaty-puppet'

import {
  PadplusRoomPayload,
}                         from '../schemas'

export function roomRawPayloadParser (
  rawPayload: PadplusRoomPayload,
): RoomPayload {
  const payload: RoomPayload = {
    avatar       : rawPayload.bigHeadUrl,
    id           : rawPayload.chatroomId,
    memberIdList : rawPayload.members.map(m => m.UserName) || [],
    ownerId      : rawPayload.chatRoomOwner,
    topic        : rawPayload.nickName,
  }

  return payload
}
