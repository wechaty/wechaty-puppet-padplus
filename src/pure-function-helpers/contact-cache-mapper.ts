import { PuppetCacheContactPayload } from 'wechaty-puppet-cache'
import { PadplusContactPayload } from '../schemas'

export function cacheToPadplusContactPayload (
  cachePayload: PuppetCacheContactPayload,
): PadplusContactPayload {
  if (!cachePayload.userName) {
    throw Error('cannot get user_name from cache payload: ' + JSON.stringify(cachePayload))
  }
  return {
    alias            : cachePayload.alias,
    bigHeadUrl       : cachePayload.bigHeadUrl,
    city             : cachePayload.city,
    contactFlag      : cachePayload.contactFlag,
    contactType      : cachePayload.contactType,
    country          : cachePayload.country,
    nickName         : cachePayload.nickName,
    province         : cachePayload.province,
    remark           : cachePayload.remark,
    sex              : cachePayload.sex,
    signature        : cachePayload.signature,
    smallHeadUrl     : cachePayload.smallHeadUrl,
    stranger         : cachePayload.stranger,
    tagList          : cachePayload.tagList,
    ticket           : cachePayload.ticket,
    userName         : cachePayload.userName,
    verifyFlag       : cachePayload.verifyFlag,
  } as PadplusContactPayload
}

export function padplusToCacheContactPayload (
  padplusPayload: PadplusContactPayload,
): PuppetCacheContactPayload {
  if (!padplusPayload.userName) {
    throw Error('cannot get user_name from padplus payload: ' + JSON.stringify(padplusPayload))
  }
  return {
    alias            : padplusPayload.alias,
    bigHeadUrl       : padplusPayload.bigHeadUrl,
    city             : padplusPayload.city,
    contactFlag      : padplusPayload.contactFlag,
    contactType      : padplusPayload.contactType,
    country          : padplusPayload.country,
    friend           : undefined,
    nickName         : padplusPayload.nickName,
    province         : padplusPayload.province,
    remark           : padplusPayload.remark,
    scene            : undefined,
    sex              : padplusPayload.sex,
    signature        : padplusPayload.signature,
    smallHeadUrl     : padplusPayload.smallHeadUrl,
    stranger         : padplusPayload.stranger,
    tagList          : padplusPayload.tagList,
    ticket           : padplusPayload.ticket,
    userName         : padplusPayload.userName,
    verifyFlag       : padplusPayload.verifyFlag,
  } as PuppetCacheContactPayload
}
