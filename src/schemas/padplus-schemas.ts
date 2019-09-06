/* eslint camelcase: 0 */
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
import {
  ContactGender,
  FriendshipType,
} from 'wechaty-puppet'
import {
  GrpcVoiceFormat,
  PadplusEmojiType,
  PadplusMessageStatus,
  PadplusMessageType,
  WechatAppMessageType,
} from './padplus-enums'

/**
 * There are two functions to generate PadplusContactPayload
 * @interface PadplusContactPayload
 */
export interface PadplusContactPayload {
  alias            : string,
  contactType      : number,
  labelLists       : string,
  bigHeadUrl       : string,                     // "http://wx.qlogo.cn/mmhead/ver_1/xfCMmibHH74xGLoyeDFJadrZXX3eOEznPefiaCa3iczxZGMwPtDuSbRQKx3Xdm18un303mf0NFia3USY2nO2VEYILw/0",
  city             : string,                     // 'Haidian'
  country          : string,                     // "CN"
  nickName         : string,                     // "梦君君", Contact: 用户昵称， Room: 群昵称
  province         : string,                     // "Beijing",
  remark           : string,                     // "女儿",
  sex              : ContactGender,
  signature        : string,                     // "且行且珍惜",
  smallHeadUrl     : string,
  stranger         : string,                     // 用户v1码，从未加过好友则为空 "v1_0468f2cd3f0efe7ca2589d57c3f9ba952a3789e41b6e78ee00ed53d1e6096b88@stranger"
  ticket           : string,                     // 用户v2码，如果非空则为单向好友(非对方好友) 'v2_xxx@stranger'
  userName         : string,                     // "mengjunjun001" | "qq512436430" Unique name
}

export interface PadplusMessagePayload {
  // tslint:disable-next-line:max-line-length
  // Private Voice Message:   "<msg><voicemsg+endflag=\"1\"+length=\"5095\"+voicelength=\"2700\"+clientmsgid=\"49c81578fd517c7679f143e8cf0be116wxid_zj2cahpwzgie12104_1526984920\"+fromusername=\"qq512436430\"+downcount=\"0\"+cancelflag=\"0\"+voiceformat=\"4\"+forwardflag=\"0\"+bufid=\"434549088970015139\"+/></msg>"
  // tslint:disable-next-line:max-line-length
  // Private File:            "<msg><appmsg+appid=\"\"+sdkver=\"0\"><title>微软云人工智能+–+全渠道智能客服.pdf</title><des></des><action></action><type>6</type><showtype>0</showtype><soundtype>0</soundtype><mediatagname></mediatagname><messageext></messageext><messageaction></messageaction><content></content><contentattr>0</contentattr><url></url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>3801373</totallen><attachid>@cdn_304f0201000448304602010002040592f70202033d0af802045d30feb602045b03d9110421777869645f7a6a3263616870777a67696531323130325f313532363937383833330204010400050201000400_aa9d0657fe4a4b45b8ed394b83fa6519_1</attachid><emoticonmd5></emoticonmd5><fileext>pdf</fileext><cdnattachurl>304f0201000448304602010002040592f70202033d0af802045d30feb602045b03d9110421777869645f7a6a3263616870777a67696531323130325f313532363937383833330204010400050201000400</cdnattachurl><cdnthumbaeskey></cdnthumbaeskey><aeskey>aa9d0657fe4a4b45b8ed394b83fa6519</aeskey><encryver>0</encryver><filekey>wxid_zj2cahpwzgie12102_1526978833</filekey></appattach><extinfo></extinfo><sourceusername></sourceusername><sourcedisplayname></sourcedisplayname><thumburl></thumburl><md5>2871ff2d8b29a6dbbe5ccc263d7a38a5</md5><statextstr></statextstr></appmsg><fromusername>qq512436430</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>"
  // tslint:disable-next-line:max-line-length
  // Room Link:               "qq512436430:\n<msg><appmsg+appid=\"\"+sdkver=\"0\"><title>金钱可能买不到快乐，但能买到自由</title><des>岁月漫长，人生苦短，去做那些真正让你感到开心和满足的事情！</des><action></action><type>5</type><showtype>0</showtype><soundtype>0</soundtype><mediatagname></mediatagname><messageext></messageext><messageaction></messageaction><content></content><contentattr>0</contentattr><url>http://mp.weixin.qq.com/s?__biz=MjM5ODQ2MDIyMA==&mid=2650713963&idx=1&sn=8cd02cba12521dadbbfaf245557d821e&chksm=bec0613889b7e82e159127b32d12225a6cdd81cb7de54710ad11d1b63df37f555e51fd4ae66f&mpshare=1&scene=24&srcid=0218N9FP2aBhxUavHvaQLElu#rd</url><lowurl></lowurl><dataurl></dataurl><lowdataurl></lowdataurl><appattach><totallen>0</totallen><attachid></attachid><emoticonmd5></emoticonmd5><fileext></fileext><cdnthumbaeskey></cdnthumbaeskey><aeskey></aeskey></appattach><extinfo></extinfo><sourceusername>gh_672f4fa64015</sourceusername><sourcedisplayname></sourcedisplayname><thumburl>http://mmbiz.qpic.cn/mmbiz_jpg/JuJRyjO2zcZtNDdzumgZTXaI3uDTV26L9UwYib7rOYWcicfsM2H9miagSMGG9sVOAFlTX398FLOibJ1wH80acJMzVw/640?wxfrom=0</thumburl><md5></md5><statextstr></statextstr></appmsg><fromusername>qq512436430</fromusername><scene>0</scene><appinfo><version>1</version><appname></appname></appinfo><commenturl></commenturl></msg>"
  // tslint:disable-next-line:max-line-length
  // Private Image:           "<?xml+version=\"1.0\"?><msg><img+aeskey=\"13ef51a71b1e452ab27a54d3323a1d49\"+encryver=\"1\"+cdnthumbaeskey=\"13ef51a71b1e452ab27a54d3323a1d49\"+cdnthumburl=\"304f0201000448304602010002040592f70202033d0af80204ba30feb602045b03d3af0421777869645f7a6a3263616870777a67696531323130305f313532363937373431330204010400010201000400\"+cdnthumblength=\"13219\"+cdnthumbheight=\"67\"+cdnthumbwidth=\"120\"+cdnmidheight=\"0\"+cdnmidwidth=\"0\"+cdnhdheight=\"0\"+cdnhdwidth=\"0\"+cdnmidimgurl=\"304f0201000448304602010002040592f70202033d0af80204ba30feb602045b03d3af0421777869645f7a6a3263616870777a67696531323130305f313532363937373431330204010400010201000400\"+length=\"159284\"+cdnbigimgurl=\"304f0201000448304602010002040592f70202033d0af80204ba30feb602045b03d3af0421777869645f7a6a3263616870777a67696531323130305f313532363937373431330204010400010201000400\"+hdlength=\"419703\"+md5=\"d5d35bda94178e8ba2eaa2b633a1ad30\"+/></msg>"
  // Privat Message:          "这是一条文本消息"
  // Room Message:            "qq512436430: 这是一条群内消息"
  // Change Room Topic:       "content": "\"李佳芮\"修改群名为“哈哈”"
  // Room Join:               "\"李佳芮\"邀请你加入了群聊，群聊参与人还有：小桔、桔小秘、小小桔、wuli舞哩客服、舒米"

  content: string,
  data?  : string | null,     // Stream Message has data, Text Message don't need data

  // Room Message:      "5410625297@chatroom"
  // Private Message:   "qq512436430"
  fromUser : string,
  messageId: string,

  // Voice Message:           ""
  // Change Room Topic:       ""
  // Invite to Room:          ""
  // Kick Off from the Room:  ""
  // Private File Message:    "<msgsource+/>"
  // Room Link:               "<msgsource><silence>0</silence><membercount>4</membercount></msgsource>"
  // Private Link:            "<msgsource+/>"
  // Private Image Message:   "<msgsource><img_file_name>定价策略参考.jpeg</img_file_name></msgsource>"
  // Room Image:              "<msgsource><img_file_name>382300af-8b6e-4dc1-8dee-b922a8dca18e+(1).jpeg</img_file_name><silence>0</silence><membercount>4</membercount></msgsource>"
  // Private Text:            "<msgsource+/>"
  // Room Text:               "<msgsource><silence>0</silence><membercount>4</membercount></msgsource>"
  messageSource: string,
  messageType  : PadplusMessageType        // 5
  status       : PadplusMessageStatus,     // 1
  timestamp    : number,
  toUser       : string,                  // Contact['user_name']  "wxid_zj2cahpwzgie12"

  // Differenc with web: No stranger, and No starFriend
  // No MediaId, no FileName, no FileSize, no FileMd5, no FileType, no MMFileExt, no Signature.....
}

/**
 * from Message
 */
// export interface PadplusRecomendInfo {
//   UserName:   string,
//   NickName:   string,  // display_name
//   Content:    string,  // request message
//   HeadImgUrl: string,  // message.RecommendInfo.HeadImgUrl

//   Ticket:     string,  // a pass token
//   VerifyFlag: number,
// }

// export const enum PadplusMediaType {
//   Image      = 1,
//   Video      = 2,
//   Audio      = 3,
//   Attachment = 4,
// }

export interface PadplusRoomMemberPayload {
  contactId: string,
  nickName: string,
  displayName: string,
  bigHeadUrl: string,
  smallHeadUrl: string,
  inviterId: string,
}

export interface PadplusMemberBrief {
  userName : string,
  nickName?: string,
}

/**
 * @interface PadplusRoomPayload
 */
export interface PadplusRoomPayload {
  alias          : string,
  bigHeadUrl     : string,
  chatRoomOwner  : string,
  chatroomVersion: number,
  contactType    : number,
  stranger       : string,
  members        : PadplusMemberBrief[],
  labelLists     : string,
  nickName       : string,
  smallHeadUrl   : string,
  ticket         : string,
  chatroomId     : string,
  memberCount    : number,
}

export interface PadplusRoomMemberListPayload {
  chatroomId  : number,                   // not know: 700000156,
  count       : number,                   // 4,
  // tslint:disable-next-line:max-line-length
  member      : PadplusRoomMemberPayload[],   // JSON.parse(decodeURIComponent(member)): PadplusRoomRawMember[] |  '[{"big_head":"http://wx.qlogo.cn/mmhead/ver_1/DpS0ZssJ5s8tEpSr9JuPTRxEUrCK0USrZcR3PjOMfUKDwpnZLxWXlD4Q38bJpcXBtwXWwevsul1lJqwsQzwItQ/0","chatroom_nick_name":"","invited_by":"wxid_7708837087612","nick_name":"李佳芮","small_head":"http://wx.qlogo.cn/mmhead/ver_1/DpS0ZssJ5s8tEpSr9JuPTRxEUrCK0USrZcR3PjOMfUKDwpnZLxWXlD4Q38bJpcXBtwXWwevsul1lJqwsQzwItQ/132","user_name":"qq512436430"},{"big_head":"http://wx.qlogo.cn/mmhead/ver_1/kcBj3gSibfFd2I9vQ8PBFyQ77cpPIfqkFlpTdkFZzBicMT6P567yj9IO6xG68WsibhqdPuG82tjXsveFATSDiaXRjw/0","chatroom_nick_name":"","invited_by":"wxid_7708837087612","nick_name":"梦君君","small_head":"http://wx.qlogo.cn/mmhead/ver_1/kcBj3gSibfFd2I9vQ8PBFyQ77cpPIfqkFlpTdkFZzBicMT6P567yj9IO6xG68WsibhqdPuG82tjXsveFATSDiaXRjw/132","user_name":"mengjunjun001"},{"big_head":"http://wx.qlogo.cn/mmhead/ver_1/3CsKibSktDV05eReoAicV0P8yfmuHSowfXAMvRuU7HEy8wMcQ2eibcaO1ccS95PskZchEWqZibeiap6Gpb9zqJB1WmNc6EdD6nzQiblSx7dC1eGtA/0","chatroom_nick_name":"","invited_by":"wxid_7708837087612","nick_name":"苏轼","small_head":"http://wx.qlogo.cn/mmhead/ver_1/3CsKibSktDV05eReoAicV0P8yfmuHSowfXAMvRuU7HEy8wMcQ2eibcaO1ccS95PskZchEWqZibeiap6Gpb9zqJB1WmNc6EdD6nzQiblSx7dC1eGtA/132","user_name":"wxid_zj2cahpwzgie12"},{"big_head":"http://wx.qlogo.cn/mmhead/ver_1/piaHuicak41b6ibmcEVxoWKnnhgGDG5EbaD0hibwkrRvKeDs3gs7XQrkym3Q5MlUeSKY8vw2FRVVstialggUxf2zic2O8CvaEsicSJcghf41nibA940/0","chatroom_nick_name":"","invited_by":"wxid_zj2cahpwzgie12","nick_name":"王宁","small_head":"http://wx.qlogo.cn/mmhead/ver_1/piaHuicak41b6ibmcEVxoWKnnhgGDG5EbaD0hibwkrRvKeDs3gs7XQrkym3Q5MlUeSKY8vw2FRVVstialggUxf2zic2O8CvaEsicSJcghf41nibA940/132","user_name":"wxid_7708837087612"}]\n',
  message     : string,                   // '',
  contactId   : string,                   // '6350854677@chatroom'
}

export interface PadplusRoomInvitationPayload {
  id       : string,
  fromUser : string,
  roomName : string,
  timestamp: number,
  url      : string,
}

export interface PadplusAppMessagePayload {
  des?          : string,
  thumburl?     : string,
  title         : string,
  url           : string,
  appattach?    : PadplusAppAttachPayload,
  type          : WechatAppMessageType,
  md5?          : string,
  fromusername? : string,
  recorditem?   : string,
}

export interface PadplusAppAttachPayload {
  totallen?      : number,
  attachid?      : string,
  emoticonmd5?   : string,
  fileext?       : string,
  cdnattachurl?  : string,
  aeskey?        : string,
  cdnthumbaeskey?: string,
  encryver?      : number,
  islargefilemsg : number,
}

export interface PadplusEmojiMessagePayload {
  cdnurl: string,
  type  : PadplusEmojiType,
  len   : number,
  width : number,
  height: number,
}

export interface PadplusImageMessagePayload {
  aesKey: string,
  encryVer: number,
  cdnThumbAesKey: string,
  cdnThumbUrl: string,
  cdnThumbLength: number,
  cdnThumbHeight: number,
  cdnThumbWidth: number,
  cdnMidHeight: number,
  cdnMidWidth: number,
  cdnHdHeight: number,
  cdnHdWidth: number,
  cdnMidImgUrl: string,
  length?: number,
  cdnBigImgUrl?: string,
  hdLength?: number,
  md5: string,
}

export interface PadplusRecalledMessagePayload {
  session: string,
  msgId: string,
  newMsgId: string,
  replaceMsg: string,
}

export interface PadplusVoiceMessagePayload {
  endFlag: number,
  length: number,
  voiceLength: number,
  clientMsgId: string,
  fromUsername: string,
  downCount: number,
  cancelFlag: number,
  voiceFormat: GrpcVoiceFormat,
  forwardFlag: number,
  bufId: number,
}

export interface PadplusLocationMessagePayload {
  x: number,
  y: number,
  scale: number,
  mapType: string,
  label: string,
  poiId: string,
  poiName: string,
  fromUsername: string,
}

export interface PadplusVideoMessagePayload {
  aesKey: string,
  cdnThumbAesKey: string,
  cdnVideoUrl: string,
  cdnThumbUrl: string,
  length: number,
  playLength: number,
  cdnThumbLength: number,
  cdnThumbWidth: number,
  cdnThumbHeight: number,
  fromUsername: string,
  md5: string,
  newMd5: string,
  isAd: boolean,
}

export interface PadplusFriendshipPayload {
  fromusername    : string,   // 'lizhuohuan'
  encryptusername : string,   // v1_xxx@stranger'
  content         : string,   // 'hello'
  ticket          : string,   // 'v2_1a0d2cf325e64b6f74bed09e944529e7cc7a7580cb323475050664566dd0302d89b8e2ed95b596b459cf762d94a0ce606da39babbae0dc26b18a62e079bfc120@stranger',
}

export interface PadplusRequestTokenPayload {
  full_url        : string,
  info            : string,
  message         : string,
  share_url       : string,
  status          : number,
}

export interface PadplusRoomInviteEvent {
  fromUser: string,
  msgId: string,
  roomName: string,
  timestamp: number,
  url: string,
}

export interface FriendshipPayloadBase {
  id        : string,

  contactId : string,
  hello?    : string,
}

export type FriendshipPayloadConfirm = FriendshipPayloadBase & {
  type      : FriendshipType.Confirm,
}

export type FriendshipPayloadReceive = FriendshipPayloadBase & {
  stranger? : string,
  ticket    : string,
  type      : FriendshipType.Receive,
}

export type FriendshipPayloadVerify = FriendshipPayloadBase & {
  type      : FriendshipType.Verify,
}

export type FriendshipPayload = FriendshipPayloadConfirm
                                  | FriendshipPayloadReceive
                                  | FriendshipPayloadVerify

export interface PadplusMessageSource {
  silence?: boolean,
  memberCount?: number,
  imageFileName?: string,
  atUserList?: string[],
}
