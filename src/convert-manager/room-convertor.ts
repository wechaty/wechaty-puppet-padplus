import { RoomPayload, RoomMemberPayload } from "wechaty-puppet";
import { PadplusRoomPayload, PadplusRoomMemberPayload, GrpcRoomRawPayload } from "../schemas";

export const convertRoomFromGrpc = (room: GrpcRoomRawPayload): PadplusRoomPayload => {
  const roomPayload: PadplusRoomPayload = {
    alias          : room.smallHeadImgUrl,
    bigHeadUrl     : room.bigHeadImgUrl,
    chatRoomOwner  : room.chatRoomOwner,
    chatroomVersion: room.chatroomVersion,
    contactType    : room.contactType,
    stranger       : '', // TODO: need to CHECK
    members        : [],
    labelLists     : room.labelLists,
    nickName       : room.nickName,
    smallHeadUrl   : room.smallHeadImgUrl,
    ticket         : room.ticket,
    chatroomId     : room.userName,
    memberCount    : 1,
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