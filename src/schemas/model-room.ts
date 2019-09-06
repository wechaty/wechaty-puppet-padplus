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

export interface PadplusRoomInviteEvent {
  fromUser: string,
  msgId: string,
  roomName: string,
  timestamp: number,
  url: string,
}