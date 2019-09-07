import grpc from 'grpc'
import util from 'util'
import { v4 as uuid } from 'uuid'
import { log, macproToken } from '../config'

import { PadPlusServerClient } from './proto-ts/PadPlusServer_grpc_pb' // add proto file from Gao
import { CallbackPool } from '../utils/callbackHelper'

import {
  RequestObject,
  InitConfig,
  StreamResponse,
  ResponseObject,
} from './proto-ts/PadPlusServer_pb'
import { EventEmitter } from 'events'

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

  private token: string
  private endpoint: string
  private client: PadPlusServerClient

  constructor (token: string, endpoint: string) {
    super()
    this.endpoint = endpoint
    this.token = token
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
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


  public async request (apiType: number, data?: any): Promise<StreamResponse> {
    const request = new RequestObject()
    request.setToken(this.token)
    // TODO: set 其余字段

    try {
      const result = await this._request(request)
      if (result) {
        const requestId = uuid()
        return new Promise<StreamResponse>((resolve, reject) => {
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
        macproToken()
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
              const temp: ResultObject = JSON.parse(flag)
              resolve(temp.code === 200)
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
        if (requestId) {
          const callback = await CallbackPool.Instance.getCallback(requestId)
          callback(data)
        }
      })
      await new Promise((resolve, reject) => {
        result.once('error', (err: any) => {
          log.silly(PRE, 'grpc server error', err)
          return reject(new Error('ERROR'))
        })
        result.once('end', () => {
          log.silly(PRE, 'grpc server end')
          return reject(new Error('END'))
        })
        result.once('close', () => {
          log.silly(PRE, 'grpc server close')
          return reject(new Error('CLOSE'))
        })
        result.once('data', (dataStr: string) => {
          resolve(dataStr)
        })
      })
    } catch (err) {
      log.silly(PRE, `error : ${err}`)
    }
  }

}
