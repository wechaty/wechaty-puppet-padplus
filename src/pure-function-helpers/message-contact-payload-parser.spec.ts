import test  from 'blue-tape'

import {
  PadplusMessagePayload,
  PadplusContactMessagePayload,
}                             from '../schemas'

import { contactMessageParser } from './message-contact-payload-parser'

test('receive contact message in room message', async t => {
  const PADPLUS_MESSAGE_PAYLOAD_SYS: PadplusMessagePayload = {
    appMsgType: undefined,
    content: 'Soul001001:\n<?xml version="1.0" encoding="UTF-8" standalone="no"?><msg ContactFlag="0" alias="" antispamticket="v2_a5116bee322c36fb208926ef865919c3c7e4adaf0189886e18e1c87cb718e9a43c63b7af34d47cd313aec1860802b218f1fc3e4555dc4695c32e5c70aacfe854980da2b0e71e8d168c372caa6a387b5847f1db4ac1323acaf6b5bf29a3c3c3e0beeaad57f429061b6f0bf1140a598b36db9c845f62fec6ae0f5b2b0603cadd7970b6fa52af5fe0b43f73ee5be1e0d96802a0e6942445f400f2dc47c6cb439079317b1fc43afc0cd8ca05e789362e0156ec1ed4af498684c7e24e93c7510559a0@stranger" bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/0" brandFlags="0" brandHomeUrl="" brandIconUrl="" brandSubscriptConfigUrl="" certflag="0" certinfo="" city="" fullpy="bainiangouzijishuzhichi" imagestatus="3" nickname="百年-句子技术支持" province="" regionCode="" scene="17" sex="0" shortpy="" sign="" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/132" username="v1_428e5196e82cd8ee628763170f82fc159ca62205ef1fa8e6e43653af6c7ad420f452c219db76914de7db6c0034bc294b@stranger"/>',
    createTime: 1572518538274,
    fileName: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
    fromMemberNickName: '苏畅 ',
    fromMemberUserName: 'Soul001001',
    fromUserName: '23580556113@chatroom',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '8884848644617388943',
    msgSource: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
    msgSourceCd: 2,
    msgType: 42,
    newMsgId: 8884848644617389000,
    pushContent: '苏畅 : [名片]百年-句子技术支持',
    status: 3,
    toUserName: 'wxid_e2lc33auu61g22',
    uin: '3710862731',
    url: undefined,
    wechatUserName: 'wxid_e2lc33auu61g22',
  }
  const EXPECTED_MESSAGE_CONTACT_PAYLOAD_SYS: PadplusContactMessagePayload = {
    antispamticket: 'v2_a5116bee322c36fb208926ef865919c3c7e4adaf0189886e18e1c87cb718e9a43c63b7af34d47cd313aec1860802b218f1fc3e4555dc4695c32e5c70aacfe854980da2b0e71e8d168c372caa6a387b5847f1db4ac1323acaf6b5bf29a3c3c3e0beeaad57f429061b6f0bf1140a598b36db9c845f62fec6ae0f5b2b0603cadd7970b6fa52af5fe0b43f73ee5be1e0d96802a0e6942445f400f2dc47c6cb439079317b1fc43afc0cd8ca05e789362e0156ec1ed4af498684c7e24e93c7510559a0@stranger',
    bigheadimgurl: 'http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/0',
    nickname: '百年-句子技术支持',
    smallheadimgurl: 'http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/132',
    username: 'v1_428e5196e82cd8ee628763170f82fc159ca62205ef1fa8e6e43653af6c7ad420f452c219db76914de7db6c0034bc294b@stranger',
  }

  const payload = await contactMessageParser(PADPLUS_MESSAGE_PAYLOAD_SYS)
  t.deepEqual(payload, EXPECTED_MESSAGE_CONTACT_PAYLOAD_SYS, 'should parse contact message payload in room message')
})

test('receive contact message in private message', async t => {
  const PADPLUS_MESSAGE_PAYLOAD_SYS: PadplusMessagePayload = {
    appMsgType: undefined,
    content: '<?xml version="1.0" encoding="UTF-8" standalone="no"?><msg ContactFlag="0" alias="" antispamticket="v2_a5116bee322c36fb208926ef865919c392983de77f98a768e0ba45d9fc0fe5b64d764d4dd84af6d80fc5548b05ee7621c136544c2e0da1f0174e9cd7eda9568607de85ff36823aa4faf5d638e25a8ed3f4877407dd447571bf7287d156926e9043dc3df2d896cf5558ed8fd3c85674f18dbf8fdddc17c8366346e44a8165e2e76282bb1f00f8afb70b8e164b2bca65a4e24eb2fafa88a0b90988445625692360ec970d5cfdd67603276affb04d7805ab27530f787b62912be6f80abf2f3c0192@stranger" bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/0" brandFlags="0" brandHomeUrl="" brandIconUrl="" brandSubscriptConfigUrl="" certflag="0" certinfo="" city="" fullpy="bainiangouzijishuzhichi" imagestatus="3" nickname="百年-句子技术支持" province="" regionCode="" scene="17" sex="0" shortpy="" sign="" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/132" username="v1_428e5196e82cd8ee628763170f82fc159ca62205ef1fa8e6e43653af6c7ad420f452c219db76914de7db6c0034bc294b@stranger"/>',
    createTime: 1572518937277,
    fileName: undefined,
    fromMemberNickName: undefined,
    fromMemberUserName: undefined,
    fromUserName: 'Soul001001',
    imgBuf: '',
    imgStatus: 1,
    l1MsgType: 5,
    msgId: '1382369610818952888',
    msgSource: '',
    msgSourceCd: 2,
    msgType: 42,
    newMsgId: 1382369610818953000,
    pushContent: '苏畅 : [名片]百年-句子技术支持',
    status: 3,
    toUserName: 'wxid_e2lc33auu61g22',
    uin: '3710862731',
    url: undefined,
    wechatUserName: 'wxid_e2lc33auu61g22',
  }
  const EXPECTED_MESSAGE_CONTACT_PAYLOAD_SYS: PadplusContactMessagePayload = {
    antispamticket: 'v2_a5116bee322c36fb208926ef865919c392983de77f98a768e0ba45d9fc0fe5b64d764d4dd84af6d80fc5548b05ee7621c136544c2e0da1f0174e9cd7eda9568607de85ff36823aa4faf5d638e25a8ed3f4877407dd447571bf7287d156926e9043dc3df2d896cf5558ed8fd3c85674f18dbf8fdddc17c8366346e44a8165e2e76282bb1f00f8afb70b8e164b2bca65a4e24eb2fafa88a0b90988445625692360ec970d5cfdd67603276affb04d7805ab27530f787b62912be6f80abf2f3c0192@stranger',
    bigheadimgurl: 'http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/0',
    nickname: '百年-句子技术支持',
    smallheadimgurl: 'http://wx.qlogo.cn/mmhead/ver_1/zCfGeL3u8WU2k0SFoibXfwV7XmGTJhjdR58FoF2icgkd9icRcCicSpmbibzVMbmMzfM8niaot7jGoFbuicGgQlodxQmrWgsV0ianN7VZibRjAyFKBlQs/132',
    username: 'v1_428e5196e82cd8ee628763170f82fc159ca62205ef1fa8e6e43653af6c7ad420f452c219db76914de7db6c0034bc294b@stranger',
  }

  const payload = await contactMessageParser(PADPLUS_MESSAGE_PAYLOAD_SYS)
  t.deepEqual(payload, EXPECTED_MESSAGE_CONTACT_PAYLOAD_SYS, 'should parse contact message payload in private message')
})
