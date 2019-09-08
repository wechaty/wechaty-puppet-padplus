import { ContactGender, ContactPayload, ContactType } from 'wechaty-puppet'
import { PadplusContactPayload, GrpcContactPayload } from '../schemas'

export const convertFromGrpcContact = (contactPayload: GrpcContactPayload): PadplusContactPayload => {
  const payload: PadplusContactPayload = {
    alias            : contactPayload.Alias,
    bigHeadUrl       : contactPayload.BigHeadImgUrl,
    city             : contactPayload.City,
    contactType      : 1,
    country          : '', // TODO: need to CHECK
    labelLists       : contactPayload.LabelLists,
    nickName         : contactPayload.NickName,
    province         : contactPayload.Province,
    remark           : contactPayload.Remark,
    sex              : contactPayload.Sex as ContactGender.Male,
    signature        : contactPayload.Signature,
    smallHeadUrl     : contactPayload.SmallHeadImgUrl,
    stranger         : contactPayload.EncryptUsername,
    ticket           : '', // TODO: need to check
    userName         : contactPayload.UserName,
  }
  return payload
}

export const convertToPuppetContact = (payload: PadplusContactPayload) => {
  const result: ContactPayload = {
    avatar : payload.smallHeadUrl,
    gender : ContactGender.Male,
    id     : payload.userName,
    name   : payload.nickName,
    type   : ContactType.Personal,
  }
  return result
}
