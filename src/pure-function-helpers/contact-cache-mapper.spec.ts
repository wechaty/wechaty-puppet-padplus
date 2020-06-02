#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import { WechatyCacheContactPayload } from 'wechaty-cache'
import { PadplusContactPayload } from '../schemas'

import { cacheToPadplusContactPayload, padplusToCacheContactPayload } from './contact-cache-mapper'

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

test('contact-cache-mapper', async t => {
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
    tagList            : '',
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
    tagList              : '',
    ticket               : '',
    userName             : 'wxid_v7j3e9kna9l912',
    verifyFlag           : 0,
  }

  const EXPECTED_CONTACT_PAYLOAD_PERSONAL: WechatyCacheContactPayload = {
    alias              : 'lylezhuifeng',
    bigHeadUrl         : 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132',
    city               : 'Haidian',
    contactFlag        : 3,
    contactType        : 1,
    country            : '',
    friend             : undefined,
    nickName           : '高原ོ',
    province           : 'Beijing',
    remark             : '',
    scene              : undefined,
    sex                : 1,
    signature          : '',
    smallHeadUrl       : 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/132',
    stranger           : 'v1_xxx',
    tagList            : '',
    ticket             : '',
    userName           : 'lylezhuifeng',
    verifyFlag         : 0,
  }

  const EXPECTED_CONTACT_PAYLOAD_OFFICIAL: WechatyCacheContactPayload = {
    alias                : 'wxid_v7j3e9kna9l912',
    bigHeadUrl           : 'http://wx.qlogo.cn/mmhead/ver_1/icxUZE0qz1c1HubRfXHscMA1PialA7q3OEIWiaRtUjYmpj2EDFhTNGwlicUFe1NQR67gVGgjhILV1ZTsZ1qO3XTMehhH1k6icF1adbaibUMJXbMWk/132',
    city                 : 'Fengtai',
    contactFlag          : 3,
    contactType          : 1,
    country              : '',
    friend               : undefined,
    nickName             : '李青青',
    province             : 'Beijing',
    remark               : '',
    scene                : undefined,
    sex                  : 2,
    signature            : '',
    smallHeadUrl         : 'http://wx.qlogo.cn/mmhead/ver_1/icxUZE0qz1c1HubRfXHscMA1PialA7q3OEIWiaRtUjYmpj2EDFhTNGwlicUFe1NQR67gVGgjhILV1ZTsZ1qO3XTMehhH1k6icF1adbaibUMJXbMWk/132',
    stranger             : 'v1_xxx',
    tagList              : '',
    ticket               : '',
    userName             : 'wxid_v7j3e9kna9l912',
    verifyFlag           : 0,
  }

  const resultPersonalCache = padplusToCacheContactPayload(PADPLUS_CONTACT_PAYLOAD_PERSONAL)
  t.deepEqual(resultPersonalCache, EXPECTED_CONTACT_PAYLOAD_PERSONAL, 'should parse ContactPayload for male account payload from padplus')

  const resultOfficialCache = padplusToCacheContactPayload(PADPLUS_CONTACT_PAYLOAD_OFFICIAL)
  t.deepEqual(resultOfficialCache, EXPECTED_CONTACT_PAYLOAD_OFFICIAL, 'should parse ContactPayload for female account payload from padplus')

  t.throws(() => padplusToCacheContactPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => padplusToCacheContactPayload(undefined as any), 'should throw exception for undifined')

  const resultPersonalPadplus = cacheToPadplusContactPayload(EXPECTED_CONTACT_PAYLOAD_PERSONAL)
  t.deepEqual(resultPersonalPadplus, PADPLUS_CONTACT_PAYLOAD_PERSONAL, 'should parse ContactPayload for male account payload from cache')

  const resultOfficialPadplus = cacheToPadplusContactPayload(EXPECTED_CONTACT_PAYLOAD_OFFICIAL)
  t.deepEqual(resultOfficialPadplus, PADPLUS_CONTACT_PAYLOAD_OFFICIAL, 'should parse ContactPayload for female account payload from cache')

  t.throws(() => cacheToPadplusContactPayload({} as any), 'should throw exception for invalid object')
  t.throws(() => cacheToPadplusContactPayload(undefined as any), 'should throw exception for undifined')
})
