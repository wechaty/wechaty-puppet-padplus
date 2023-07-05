import { types } from '@juzi/wechaty-puppet'
type YOU = typeof types.YOU
export interface RoomJoinEvent {
  inviteeIdList : Array<string | YOU>,
  inviterId     : string | YOU,
  roomId        : string,
  timestamp     : number, // Unix Timestamp, in seconds
}

export interface RoomLeaveEvent {
  leaverIdList : Array<string | YOU>,
  removerId    : string | YOU,
  roomId       : string,
  timestamp    : number,  // Unix Timestamp, in seconds
  dismiss?     : boolean,
}

export interface RoomTopicEvent {
  changerId : string | YOU,
  roomId    : string,
  topic     : string,
  timestamp : number, // Unix Timestamp, in seconds
}

export interface RoomInviteEvent {
  fromUser: string,
  msgId:  string,
  receiver: string,
  roomName: string,
  thumbUrl: string,
  timestamp: number, // Unix Timestamp, in seconds
  url: string,
}
