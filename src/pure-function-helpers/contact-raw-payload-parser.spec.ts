#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  ContactGender,
  ContactPayload,
  ContactType,
}                       from 'wechaty-puppet'

import {
  PadplusContactPayload,
}                             from '../schemas'

import { contactRawPayloadParser } from './contact-raw-payload-parser'

/**
 *
 * {
  "alias": "",
  "bigHeadUrl": "http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132",
  "city": "Haidian",
  "contactType": 1,
  "country": "",
  "tagList": "",
  "nickName": "高原ོ",
  "province": "Beijing",
  "remark": "",
  "sex": 1,
  "signature": "",
  "smallHeadUrl": "http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132",
  "stranger": "v1_xxx",
  "ticket": "",
  "userName": "lylezhuifeng"
}
 */

test('contactRawPayloadParser', async t => {
  const PADPLUS_CONTACT_PAYLOAD_PERSONAL: PadplusContactPayload = {
    alias              : 'lylezhuifeng',
    bigHeadUrl         : 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132',
    city               : 'Haidian',
    contactFlag        : 3,
    contactType        : 1,
    country            : '',
    nickName           : '高原ོ',
    province           : 'Beijing',
    remark             : '',
    sex                : 1,
    signature          : '',
    smallHeadUrl       : 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132',
    stranger           : 'v1_xxx',
    tagList         : '',
    ticket             : '',
    userName           : 'lylezhuifeng',
    verifyFlag         : 0,
  }

  const PADPLUS_CONTACT_PAYLOAD_OFFICIAL: PadplusContactPayload = {
    alias                : 'wxid_v7j3e9kna9l912',
    bigHeadUrl           : 'http://wx.qlogo.cn/mmhead/ver_1/icxUZE0qz1c1HubRfXHscMA1PialA7q3OEIWiaRtUjYmpj2EDFhTNGwlicUFe1NQR67gVGgjhILV1ZTsZ1qO3XTMehhH1k6icF1adbaibUMJXbMWk/132',
    city                 : 'Fengtai',
    contactFlag          : 3,
    contactType          : 1,
    country              : '',
    nickName             : '李青青',
    province             : 'Beijing',
    remark               : '',
    sex                  : 2,
    signature            : '',
    smallHeadUrl         : 'http://wx.qlogo.cn/mmhead/ver_1/icxUZE0qz1c1HubRfXHscMA1PialA7q3OEIWiaRtUjYmpj2EDFhTNGwlicUFe1NQR67gVGgjhILV1ZTsZ1qO3XTMehhH1k6icF1adbaibUMJXbMWk/132',
    stranger             : 'v1_xxx',
    tagList           : '',
    ticket               : '',
    userName             : 'wxid_v7j3e9kna9l912',
    verifyFlag           : 0,
  }

  const EXPECTED_CONTACT_PAYLOAD_PERSONAL: ContactPayload = {
    alias     : '',
    avatar    : 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132',
    city      : 'Haidian',
    friend    : true,
    gender    : ContactGender.Male,
    id        : 'lylezhuifeng',
    name      : '高原ོ',
    province  : 'Beijing',
    signature : '',
    type      : ContactType.Personal,
    weixin    : 'lylezhuifeng',
  }

  const EXPECTED_CONTACT_PAYLOAD_OFFICIAL: ContactPayload = {
    alias     : '',
    avatar    : 'http://wx.qlogo.cn/mmhead/ver_1/icxUZE0qz1c1HubRfXHscMA1PialA7q3OEIWiaRtUjYmpj2EDFhTNGwlicUFe1NQR67gVGgjhILV1ZTsZ1qO3XTMehhH1k6icF1adbaibUMJXbMWk/132',
    city      : 'Fengtai',
    friend    : true,
    gender    : ContactGender.Female,
    id        : 'wxid_v7j3e9kna9l912',
    name      : '李青青',
    province  : 'Beijing',
    signature : '',
    type      : ContactType.Personal,
    weixin    : 'wxid_v7j3e9kna9l912',
  }

  const resultPersonal = contactRawPayloadParser(PADPLUS_CONTACT_PAYLOAD_PERSONAL)
  t.deepEqual(resultPersonal, EXPECTED_CONTACT_PAYLOAD_PERSONAL, 'should parse ContactPayload for male account payload')

  const resultOfficial = contactRawPayloadParser(PADPLUS_CONTACT_PAYLOAD_OFFICIAL)
  t.deepEqual(resultOfficial, EXPECTED_CONTACT_PAYLOAD_OFFICIAL, 'should parse ContactPayload for female account payload')

  t.throws(() => contactRawPayloadParser({} as any), 'should throw exception for invalid object')
  t.throws(() => contactRawPayloadParser(undefined as any), 'should throw exception for undifined')
})
