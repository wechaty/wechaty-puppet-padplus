import { RoomMemberPayload } from 'wechaty-puppet'
import { PadplusRoomPayload, PadplusRoomMemberPayload, GrpcRoomPayload } from '../schemas'

export const convertRoomFromGrpc = (room: GrpcRoomPayload): PadplusRoomPayload => {
  const roomPayload: PadplusRoomPayload = {
    alias          : room.Alias,
    bigHeadUrl     : room.BigHeadImgUrl,
    chatRoomOwner  : room.ChatRoomOwner,
    chatroomId     : room.UserName,
    chatroomVersion: room.ChatroomVersion,
    contactType    : room.ContactType,
    memberCount    : JSON.parse(room.ExtInfo).length,
    members        : JSON.parse(room.ExtInfo),
    nickName       : room.NickName,
    smallHeadUrl   : room.SmallHeadImgUrl,
    stranger       : room.EncryptUsername,
    tagList     : room.LabelLists,
    ticket         : room.Ticket,
  }
  return roomPayload
}

export const convertToPuppetRoomMember = (input: PadplusRoomMemberPayload): RoomMemberPayload => {
  const resut: RoomMemberPayload = {
    avatar     : input.smallHeadUrl,
    id         : input.contactId,
    inviterId  : input.inviterId,   // 'wxid_7708837087612',
    name       : input.nickName,
    roomAlias  : input.displayName,   // '李佳芮-群里设置的备注', `chatroom_nick_name`
  }
  return resut
}
