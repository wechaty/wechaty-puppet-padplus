import { ContactGender } from 'wechaty-puppet'
import { PadplusContactPayload, GrpcContactPayload } from '../schemas'

export const convertFromGrpcContact = (contactPayload: GrpcContactPayload, isSync?: boolean): PadplusContactPayload => {
  const payload: PadplusContactPayload = {
    alias            : contactPayload.Alias,
    bigHeadUrl       : contactPayload.BigHeadImgUrl,
    city             : contactPayload.City,
    contactType      : 1, // TOEO: contact type convert
    country          : '', // TODO: need to CHECK
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
  }
  return payload
}
