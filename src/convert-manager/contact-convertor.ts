import { ContactGender, ContactPayload, ContactType } from "wechaty-puppet";
import { PadplusContactPayload, GrpcContactPayload } from "../schemas";

export const convertFromGrpcContact = (contactPayload: GrpcContactPayload): PadplusContactPayload => {
  const payload: PadplusContactPayload = {
    alias            : contactPayload.Alias,
    contactType      : 1,
    labelLists       : contactPayload.LabelLists,
    bigHeadUrl       : contactPayload.BigHeadImgUrl,
    city             : contactPayload.City,
    country          : '', // TODO: need to CHECK
    nickName         : contactPayload.NickName,
    province         : contactPayload.Province,
    remark           : contactPayload.Remark,
    sex              : contactPayload.Sex as ContactGender.Male,
    signature        : contactPayload.Signature,
    smallHeadUrl     : contactPayload.SmallHeadImgUrl,
    stranger         : '', // TODO: need to CHECK
    ticket           : '', // TODO: need to CHECK
    userName         : contactPayload.UserName,
  }
  return payload
}

export const convertToPuppetContact = (payload: PadplusContactPayload) => {
  const result: ContactPayload = {
    id     : payload.userName,
    gender : ContactGender.Male,
    type   : ContactType.Personal,
    name   : payload.nickName,
    avatar : payload.smallHeadUrl,
  }
  return result
}
