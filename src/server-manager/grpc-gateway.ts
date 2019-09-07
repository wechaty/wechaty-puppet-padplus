import grpc from 'grpc'
import util from 'util'
import { v4 as uuid } from 'uuid'
import { log, padplusToken } from '../config'

import { PadPlusServerClient } from './proto-ts/PadPlusServer_grpc_pb' // add proto file from Gao
import { CallbackPool } from '../utils/callbackHelper'

import {
  RequestObject,
  InitConfig,
  StreamResponse,
  ResponseObject,
  ApiType,
} from './proto-ts/PadPlusServer_pb'
import { EventEmitter } from 'events'
import FileBox from 'file-box';
import { GrpcEventEmitter } from './grpc-event-emitter';

export interface CallBackBuffer {
  [id: string]: (buf: any) => void
}

export interface ResultObject {
  code: number,
  data: any,
}

const PRE = 'GRPC_GATEWAY'

export type GrpcGatewayEvent = 'data'

export class GrpcGateway extends EventEmitter {

  private static _instance?: GrpcGateway = undefined;

  public static get Instance () {
    return this._instance
  }

  private eventEmitterMap: { [name: string]: GrpcEventEmitter } = {}

  public static init (
    token: string,
    endpoint: string,
    name: string,
  ): GrpcEventEmitter {
    if (!this._instance) {
      this._instance = new GrpcGateway(token, endpoint)
    }
    return this._instance.addNewInstance(name);
  }

  private client: PadPlusServerClient

  private constructor (
    private token: string,
    private endpoint: string,
  ) {
    super()
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
  }

  private addNewInstance (
    name: string,
  ): GrpcEventEmitter {
    const eventEmitter = new GrpcEventEmitter()
    this.eventEmitterMap[name] = eventEmitter
    return eventEmitter
  }

  public emit (event: 'data', data: StreamResponse): boolean
  public emit (event: never, data: any): never

  public emit (
    event: GrpcGatewayEvent,
    data?: StreamResponse,
  ): boolean {
    return super.emit(event, data)
  }

  public on (event: 'data', listener: ((data: StreamResponse) => any)): this
  public on (event: never, listener: ((data: any) => any)): never

  public on (
    event: GrpcGatewayEvent,
    listener: ((data: StreamResponse) => any),
  ): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)
    super.on(event, (data: StreamResponse) => {
      try {
        listener.call(this, data)
      } catch (e) {
        log.error(PRE, `onFunction(${event}) listener exception: ${e}`)
      }
    })
    return this
  }


  public async request (apiType: ApiType, data?: any): Promise<StreamResponse> {
    const request = new RequestObject()
    const requestId = uuid()
    log.silly(`==P==A==D==P==L==U==S==<>==P==A==D==P==L==U==S==`)
    log.silly(PRE, `GRPC : ${this.token}, ${data}, ${apiType}`)
    request.setToken(this.token)
    request.setApitype(apiType)
    request.setParams(data)
    request.setRequestid(requestId)

    try {
      const result = await this._request(request)
      if (result) {
        return new Promise<StreamResponse>((resolve) => {
          CallbackPool.Instance.pushCallbackToPool(requestId, (data: StreamResponse) => {
            resolve(data)
          })
        })
      } else {
        throw new Error('failed.')
      }

      log.silly(PRE, `
      ===============================================================
      API Type : ${apiType}
      Request data : ${util.inspect(data)}
      ===============================================================
      `)
    } catch (err) {
      log.silly(PRE, `error : ${util.inspect(err)}`)
      if (err.details === 'INVALID_TOKEN') {
        padplusToken()
      }
      throw new Error(`Can not get data from Transmit Server`)
    }
  }

  private async _request (request: RequestObject): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.client.request(
        request,
        (err: Error | null, response: ResponseObject) => {
          if (err !== null) {
            reject(err)
          } else {
            const flag = response.getResult()

            if (flag) {
              // const temp: ResultObject = JSON.parse(flag)
              resolve(true)
            } else {
              reject('can not get result from response.')
            }
          }
        }
      )
    })
  }

  public async initGrpcGateway () {
    log.silly(PRE, `notify()`)
    const initConfig = new InitConfig()
    initConfig.setToken(this.token)
    try {
      const result = this.client.init(initConfig)
      log.silly(JSON.stringify(result))

      result.on('error', (err: any) => {
        log.error(PRE, err.stack)
      })
      result.on('end', () => {
        log.error(PRE, 'grpc server end.')
      })
      result.on('close', () => {
        log.error(PRE, 'grpc server close')
      })
      result.on('data', async (data: StreamResponse) => {
        const requestId = data.getRequestid()
        log.silly(PRE, `data : ${util.inspect(data.toObject())}`)
        const fileBox = FileBox.fromBase64(JSON.parse(data.getData()!).qrcode, 'qrcode.png')
        await fileBox.toFile()
        if (requestId) { // 只是短连接中请求的内容
          const callback = await CallbackPool.Instance.getCallback(requestId)
          callback(data)
        } else { // 长连接推送的内容
          log.silly(PRE, `data : ${util.inspect(data)}`)
          this.emit('data', data)
        }
      })
    } catch (err) {
      log.silly(PRE, `error : ${err}`)
    }
  }

}
