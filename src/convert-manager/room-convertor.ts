import { RoomPayload } from "wechaty-puppet";

export const convertToPuppetRoom = (grpcRoom: string): RoomPayload => {
  const result: RoomPayload = {
    id: '',
    topic: '',
    memberIdList: [],
    ownerId: '',
  };
  return result;
}