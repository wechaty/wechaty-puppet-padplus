import { StreamResponse } from '../server-manager/proto-ts/PadPlusServer_pb'
import { PadplusContactPayload, PadplusRoomPayload } from '../schemas';

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

  public resolveContactCallBack (contactId: string, data: PadplusContactPayload | PadplusRoomPayload) {
    const callbacks = this.contactRequestMap[contactId] || []
    callbacks.map(callback => callback(data))
    delete this.contactRequestMap[contactId]
  }

}
