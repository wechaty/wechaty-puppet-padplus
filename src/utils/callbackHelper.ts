import { StreamResponse } from '../server-manager/proto-ts/PadPlusServer_pb'
import { PadplusContactPayload, PadplusRoomPayload, PadplusRoomMemberMap } from '../schemas'

export class CallbackPool {

  private static _instance?: CallbackPool = undefined
  private constructor () {}

  public static get Instance () {
    if (!this._instance) {
      this._instance = new CallbackPool()
    }
    return this._instance
  }

  private poolMap: { [requestId: string]: (data: StreamResponse) => void } = {}
  private contactRequestMap: {
    [contactId: string]: Array<(data: PadplusContactPayload | PadplusRoomPayload) => void>
  } = {}

  private contactAliasMap: {
    [contactId: string]: { [alias: string]: () => void },
  } = {}

  private roomTopicMap: {
    [roomId: string]: { [topic: string]: () => void },
  } = {}

  private acceptFriendMap: {
    [contactId: string]: Array<() => void>
  } = {}

  private roomMemberMap: {
    [roomId: string]: Array<(memberList: PadplusRoomMemberMap) => void>
  } = {}

  public pushCallbackToPool (requestId: string, callback: (data: StreamResponse) => void) {
    this.poolMap[requestId] = callback
  }

  public getCallback (requestId: string) {
    return this.poolMap[requestId]
  }

  public removeCallback (requestId: string) {
    delete this.poolMap[requestId]
  }

  public pushContactCallback (
    contactId: string,
    callback: (data: PadplusContactPayload | PadplusRoomPayload) => void
  ) {
    if (!this.contactRequestMap[contactId]) {
      this.contactRequestMap[contactId] = []
    }
    this.contactRequestMap[contactId].push(callback)
  }

  public resolveContactCallBack (contactId: string, data: PadplusContactPayload) {
    const callbacks = this.contactRequestMap[contactId] || []
    callbacks.map(callback => callback(data))

    this.resolveContactAliasCallback(contactId, data.remark)
    this.resolveAcceptFriendCallback(contactId)
    delete this.contactRequestMap[contactId]
  }

  public resolveRoomCallBack (roomId: string, data: PadplusRoomPayload) {
    const callbacks = this.contactRequestMap[roomId] || []
    callbacks.map(callback => callback(data))

    this.resolveRoomTopicCallback(data.chatroomId, data.nickName)
    delete this.contactRequestMap[roomId]
  }

  public pushContactAliasCallback (contactId: string, alias: string, callback: () => void) {
    if (!this.contactAliasMap[contactId]) {
      this.contactAliasMap[contactId] = {}
    }
    this.contactAliasMap[contactId][alias] = callback
  }

  private resolveContactAliasCallback (contactId: string, alias: string) {
    const callback = this.contactAliasMap[contactId] && this.contactAliasMap[contactId][alias]
    if (callback) {
      callback()
      delete this.contactAliasMap[contactId][alias]
    }
  }

  public pushRoomTopicCallback (roomId: string, topic: string, callback: () => void) {
    if (!this.roomTopicMap[roomId]) {
      this.roomTopicMap[roomId] = {}
    }
    this.roomTopicMap[roomId][topic] = callback
  }

  private resolveRoomTopicCallback (roomId: string, topic: string) {
    const callback = this.roomTopicMap[roomId] && this.roomTopicMap[roomId][topic]
    if (callback) {
      callback()
      delete this.roomTopicMap[roomId][topic]
    }
  }

  public pushAcceptFriendCallback (contactId: string, callback: () => void) {
    if (!this.acceptFriendMap[contactId]) {
      this.acceptFriendMap[contactId] = []
    }
    this.acceptFriendMap[contactId].push(callback)
  }

  private resolveAcceptFriendCallback (contactId: string) {
    const callbacks = this.acceptFriendMap[contactId]
    if (callbacks) {
      callbacks.map(cb => cb())
      delete this.acceptFriendMap[contactId]
    }
  }

  public pushRoomMemberCallback (roomId: string, callback: (memberList: PadplusRoomMemberMap) => void) {
    if (!this.roomMemberMap[roomId]) {
      this.roomMemberMap[roomId] = []
    }
    this.roomMemberMap[roomId].push(callback)
  }

  public resolveRoomMemberCallback (roomId: string, memberList: PadplusRoomMemberMap) {
    const callbacks = this.roomMemberMap[roomId] && this.roomMemberMap[roomId]
    if (callbacks) {
      callbacks.map(cb => cb(memberList))
      delete this.roomMemberMap[roomId]
    }
  }

}
