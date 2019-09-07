// import { v4 as uuid } from 'uuid';


export class CallbackPool {
  private static _instance?: CallbackPool = undefined;
  private constructor () {
    
  }
  public static get Instance () {
    if (!this._instance) {
      this._instance = new CallbackPool();
    }
    return this._instance;
  }
  private poolMap: { [requestId: string]: (data: any) => void } = {};
  pushCallbackToPool = async (requestId: string, callback: (data: any) => void) => {
    return new Promise((resolve,reject) => {
      this.poolMap[requestId] = callback;
      resolve();
    })
  };
  getCallback = async (requestId: string) => {
    return this.poolMap[requestId];
  }
  removeCallback = async (requestId: string) => {
    delete this.poolMap[requestId];
  }
}