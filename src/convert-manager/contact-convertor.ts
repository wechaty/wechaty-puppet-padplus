import { ContactGender } from 'wechaty-puppet'
import { PadplusContactPayload, GrpcContactPayload } from '../schemas'

export const convertFromGrpcContact = (contactPayload: GrpcContactPayload, isSync?: boolean): PadplusContactPayload => {
  const payload: PadplusContactPayload = {
    alias            : contactPayload.Alias,
    bigHeadUrl       : contactPayload.BigHeadImgUrl,
    city             : contactPayload.City,
    contactFlag      : contactPayload.ContactFlag,
    contactType      : Number(contactPayload.ContactType),
    country          : '',
    labelLists       : contactPayload.LabelLists,
    nickName         : contactPayload.NickName,
    province         : contactPayload.Province,
    remark           : contactPayload.RemarkName,
    sex              : contactPayload.Sex as ContactGender,
    signature        : contactPayload.Signature,
    smallHeadUrl     : contactPayload.SmallHeadImgUrl,
    stranger         : isSync ? contactPayload.ContactFlag.toString() : contactPayload.EncryptUsername,
    ticket           : '', // TODO: need to check
    userName         : contactPayload.UserName,
    verifyFlag       : contactPayload.VerifyFlag,
  }
  return payload
}
