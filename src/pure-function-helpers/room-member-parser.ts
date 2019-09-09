import { PadplusRoomMemberPayload, PadplusMemberBrief } from '../schemas'

export function roomMemberParser (
  input: PadplusMemberBrief[],
): { [contactId: string]: PadplusRoomMemberPayload } {
  const result: { [contactId: string]: PadplusRoomMemberPayload } = {}
  input.forEach(brief => {
    const memberPayload: PadplusRoomMemberPayload = {
      bigHeadUrl: '',
      contactId: brief.UserName,
      displayName: '',
      inviterId: '',
      nickName: brief.NickName || '',
      smallHeadUrl: '',
    }
    result[brief.UserName] = memberPayload
  })
  return result
}
