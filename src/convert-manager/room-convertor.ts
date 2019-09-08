import { RoomPayload, RoomMemberPayload } from 'wechaty-puppet'
import { PadplusRoomPayload, PadplusRoomMemberPayload, GrpcRoomPayload } from '../schemas'

export const convertRoomFromGrpc = (room: GrpcRoomPayload): PadplusRoomPayload => {
  const roomPayload: PadplusRoomPayload = {
    alias          : room.Alias,
    bigHeadUrl     : room.BigHeadImgUrl,
    chatRoomOwner  : room.ChatRoomOwner,
    chatroomId     : room.UserName,
    chatroomVersion: room.ChatroomVersion,
    contactType    : room.ContactType,
    labelLists     : room.LabelLists,
    memberCount    : JSON.parse(room.ExtInfo).length,
    members        : JSON.parse(room.ExtInfo),
    nickName       : room.NickName,
    smallHeadUrl   : room.SmallHeadImgUrl,
    stranger       : room.EncryptUsername,
    ticket         : room.Ticket,
  }
  return roomPayload
}

export const convertToPuppetRoom = (input: PadplusRoomPayload): RoomPayload => {
  const result: RoomPayload = {
    id: '',
    memberIdList: [],
    ownerId: '',
    topic: '',
  }
  return result
}

export const convertToPuppetRoomMember = (input: PadplusRoomMemberPayload): RoomMemberPayload => {
  const resut: RoomMemberPayload = {
    avatar     : 'string',
    id         : 'string',
    inviterId  : 'string',   // 'wxid_7708837087612',
    name       : 'string',
    roomAlias  : 'string',   // '李佳芮-群里设置的备注', `chatroom_nick_name`
  }
  return resut
}
