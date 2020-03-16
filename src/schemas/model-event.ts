import { YOU } from 'wechaty-puppet'

export interface RoomJoinEvent {
  inviteeNameList : Array<(string | YOU)>,
  inviterName     : string | YOU,
  roomId          : string,
  timestamp       : number, // Unix Timestamp, in seconds
}

export interface RoomLeaveEvent {
  leaverNameList : Array<(string | YOU)>,
  removerName    : string | YOU,
  roomId         : string,
  timestamp      : number,  // Unix Timestamp, in seconds
}

export interface RoomTopicEvent {
  changerName : string | YOU,
  roomId      : string,
  topic       : string,
  timestamp   : number, // Unix Timestamp, in seconds
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
