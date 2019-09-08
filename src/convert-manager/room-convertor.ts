import { RoomPayload, RoomMemberPayload } from "wechaty-puppet";
import { PadplusRoomPayload, PadplusRoomMemberPayload } from "../schemas";

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