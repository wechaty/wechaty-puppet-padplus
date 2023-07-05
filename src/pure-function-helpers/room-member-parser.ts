import { PadplusRoomMemberPayload, PadplusMemberBrief, GrpcRoomMemberPayload } from '../schemas'

export function briefRoomMemberParser (
  input: PadplusMemberBrief[],
): { [contactId: string]: PadplusRoomMemberPayload } {
  const result: { [contactId: string]: PadplusRoomMemberPayload } = {}
  input.forEach(brief => {
    const memberPayload: PadplusRoomMemberPayload = {
      bigHeadUrl: '',
      contactId: brief.userName,
      displayName: '',
      inviterId: '',
      nickName: brief.nickName || '',
      smallHeadUrl: '',
    }
    result[brief.userName] = memberPayload
  })
  return result
}

export function roomMemberParser (
  input: GrpcRoomMemberPayload[],
): { [contactId: string]: PadplusRoomMemberPayload } {
  const result: { [contactId: string]: PadplusRoomMemberPayload } = {}
  input.forEach(member => {
    const memberPayload: PadplusRoomMemberPayload = {
      bigHeadUrl: member.HeadImgUrl,
      contactId: member.UserName,
      displayName: member.DisplayName,
      inviterId: member.InvitedBy,
      nickName: member.NickName,
      smallHeadUrl: member.HeadImgUrl,
    }
    result[member.UserName] = memberPayload
  })
  return result
}
