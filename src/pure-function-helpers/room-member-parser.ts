import { PadplusRoomMemberPayload, PadplusMemberBrief } from "../schemas";

export function roomMemberParser (
  input: PadplusMemberBrief[],
): { [contactId: string]: PadplusRoomMemberPayload } {
  const result: { [contactId: string]: PadplusRoomMemberPayload } = {};
  input.forEach(brief => {
    const memberPayload: PadplusRoomMemberPayload = {
      contactId: brief.UserName,
      nickName: brief.NickName || '',
      displayName: '',
      bigHeadUrl: '',
      smallHeadUrl: '',
      inviterId: '',
    }
    result[brief.UserName] = memberPayload;
  })
  return result;
}