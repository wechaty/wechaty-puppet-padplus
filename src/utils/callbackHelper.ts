import { StreamResponse } from '../server-manager/proto-ts/PadPlusServer_pb';

// import { v4 as uuid } from 'uuid';


export class CallbackPool {
  private static _instance?: CallbackPool = undefined;
  private constructor() {

  }
  public static get Instance() {
    if (!this._instance) {
      this._instance = new CallbackPool();
    }
    return this._instance;
  }
  private poolMap: { [requestId: string]: (data: StreamResponse) => void } = {};
  pushCallbackToPool = async (requestId: string, callback: (data: StreamResponse) => void) => {
    this.poolMap[requestId] = callback;
  };

  getCallback = async (requestId: string) => {
    return this.poolMap[requestId];
  }

  removeCallback = async (requestId: string) => {
    delete this.poolMap[requestId];
  }
}