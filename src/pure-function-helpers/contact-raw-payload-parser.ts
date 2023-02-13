import { payloads, types } from '@juzi/wechaty-puppet'

import {
  PadplusContactPayload,
}                             from '../schemas'

import {
  isContactId,
  isContactOfficialId,
}                           from './is-type'

export function contactRawPayloadParser (
  rawPayload: PadplusContactPayload,
): payloads.Contact {
  if (!rawPayload.userName) {
    /**
     * { big_head: '',
     *  city: '',
     *  country: '',
     *  intro: '',
     *  label: '',
     *  message: '',
     *  nick_name: '',
     *  provincia: '',
     *  py_initial: '',
     *  quan_pin: '',
     *  remark: '',
     *  remark_py_initial: '',
     *  remark_quan_pin: '',
     *  sex: 0,
     *  signature: '',
     *  small_head: '',
     *  status: 0,
     *  stranger: '',
     *  ticket: '',
     *  user_name: '' }
     */
    // console.log(rawPayload)
    throw Error('cannot get user_name from raw payload: ' + JSON.stringify(rawPayload))
  }

  if (!isContactId(rawPayload.userName)) {
    throw Error(`userName: ${rawPayload.userName} is not contact, detail: ${JSON.stringify(rawPayload)}`)
  }

  let contactType = types.Contact.Unknown
  if (isContactOfficialId(rawPayload.userName) || rawPayload.verifyFlag !== 0) {
    contactType = types.Contact.Official
  } else {
    contactType = types.Contact.Individual
  }
  let friend = false
  if (rawPayload.contactFlag && rawPayload.contactFlag !== 0 && rawPayload.verifyFlag === 0) {
    friend = true
  }
  const payload: payloads.Contact = {
    alias     : rawPayload.remark,
    avatar    : rawPayload.bigHeadUrl,
    city      : rawPayload.city,
    friend,
    gender    : rawPayload.sex,
    id        : rawPayload.userName,
    name      : rawPayload.nickName,
    phone     : [],
    province  : rawPayload.province,
    signature : (rawPayload.signature).replace('+', ' '),          // Stay+Foolish
    type      : contactType,
    weixin    : rawPayload.alias,
  }

  return payload
}
