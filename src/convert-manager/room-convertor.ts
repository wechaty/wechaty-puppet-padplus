import { RoomPayload, RoomMemberPayload } from "wechaty-puppet";
import { PadplusRoomPayload, PadplusRoomMemberPayload, GrpcRoomPayload } from "../schemas";

export const convertRoomFromGrpc = (room: GrpcRoomPayload): PadplusRoomPayload => {
  const roomPayload: PadplusRoomPayload = {
    alias          : room.Alias,
    bigHeadUrl     : room.BigHeadImgUrl,
    chatRoomOwner  : room.ChatRoomOwner,
    chatroomVersion: room.ChatroomVersion,
    contactType    : room.ContactType,
    stranger       : '', // TODO: need to CHECK
    members        : JSON.parse(room.ExtInfo),
    labelLists     : room.LabelLists,
    nickName       : room.NickName,
    smallHeadUrl   : room.SmallHeadImgUrl,
    ticket         : room.Ticket,
    chatroomId     : room.UserName,
    memberCount    : JSON.parse(room.ExtInfo).length,
  };
  return roomPayload
}

export const convertToPuppetRoom = (input: PadplusRoomPayload): RoomPayload => {
  const result: RoomPayload = {
    id: '',
    topic: '',
    memberIdList: [],
    ownerId: '',
  };
  return result;
}

export const convertToPuppetRoomMember = (input: PadplusRoomMemberPayload): RoomMemberPayload => {
  const resut: RoomMemberPayload = {
    id         : 'string',
    roomAlias  : 'string',   // "李佳芮-群里设置的备注", `chatroom_nick_name`
    inviterId  : 'string',   // "wxid_7708837087612",
    avatar     : 'string',
    name       : 'string',
  }
  return resut
}