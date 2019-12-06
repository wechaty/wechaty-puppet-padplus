import { ContactGender } from 'wechaty-puppet'
import { PadplusContactPayload, GrpcContactPayload, GetContactSelfInfoGrpcResponse } from '../schemas'

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
    stranger         : contactPayload.EncryptUsername,
    ticket           : '',
    userName         : contactPayload.UserName,
    verifyFlag       : contactPayload.VerifyFlag,
  }
  return payload
}

export const convertFromGrpcContactSelf = (contactPayload: GetContactSelfInfoGrpcResponse): PadplusContactPayload => {
  const payload: PadplusContactPayload = {
    alias            : contactPayload.alias,
    bigHeadUrl       : contactPayload.bigHeadImg,
    city             : contactPayload.city,
    contactFlag      : 3,
    contactType      : 0,
    country          : contactPayload.country,
    labelLists       : '',
    nickName         : contactPayload.nickName,
    province         : contactPayload.province,
    remark           : '',
    sex              : contactPayload.sex as ContactGender,
    signature        : contactPayload.signature,
    smallHeadUrl     : contactPayload.smallHeadImg,
    stranger         : '',
    ticket           : '',
    userName         : contactPayload.userName,
    verifyFlag       : 0,
  }
  return payload
}
