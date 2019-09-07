import grpc from 'grpc'
import util from 'util'
import uuid from 'uuid'
import { log, macproToken } from '../config'

import { PadPlusServerClient } from './proto-ts/PadPlusServer_grpc_pb' // add proto file from Gao

import {
  RequestObject,
  ResponseObject,
  InitConfig,
  StreamResponse,
} from './proto-ts/PadPlusServer_pb'
import { EventEmitter } from 'events'

export interface CallBackBuffer {
  [id: string]: (buf: any) => void
}

const PRE = 'GRPC_GATEWAY'

export type GrpcGatewayEvent = 'contact-list' | 'new-friend' | 'scan' | 'login' | 'message' | 'logout' | 'not-login' | 'room-member' | 'room-create' | 'room-join' | 'room-qrcode' | 'reconnect' | 'invalid-token' | 'add-friend' | 'add-friend-before-accept'

export class GrpcGateway extends EventEmitter {

  private token: string
  private endpoint: string
  private client: PadPlusServerClient
  private callbackPool: CallBackBuffer

  constructor (token: string, endpoint: string) {
    super()
    this.endpoint = endpoint
    this.token = token
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
    this.callbackPool = Object.create(null)
  }

  public async request (apiName: string, data?: any): Promise<any> {
    const request = new RequestObject()
    request.setToken(this.token)
    // TODO set 其余字段

    try {
      const result = await this._request(request)

      // TODO: 解析请求返回的数据，并返回给API层

      log.silly(PRE, `
      ===============================================================
      API Name : ${apiName}
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

  // TODO: 需要在此处调用封装的callbackPool函数，将所有请求函数放入回调池中，等待长连接中返回数据后，根据requestId调用对应的函数，resolve结果
  private async _request (request: RequestObject): Promise<any> {
    const requestId = uuid()
    return new Promise<Buffer>(async (resolve, reject) => {
      this.callbackPool[requestId] = (buffer: Buffer) => {
        delete this.callbackPool[requestId]
        resolve(buffer)
      }

      try {
        this.client.request(
          request,
          (err: Error | null, response: ResponseObject) => {
            // TODO: 处理请求返回的状态，如果请求成功则忽略，若失败则需要重试
          }
        )
      } catch (e) {
        delete this.callbackPool[requestId]
        reject(e)
      }
    })
  }

  public emit (event: 'add-friend-before-accept', data: string): boolean
  public emit (event: 'invalid-token', data: string): boolean
  public emit (event: 'not-login', data: string): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: 'new-friend', data: string): boolean
  public emit (event: 'add-friend', data: string): boolean
  public emit (event: 'room-member', data: string): boolean
  public emit (event: 'room-create', data: string): boolean
  public emit (event: 'room-join', data: string): boolean
  public emit (event: 'room-qrcode', data: string): boolean
  public emit (event: 'scan', data: string): boolean
  public emit (event: 'login', data: string): boolean
  public emit (event: 'message', data: string): boolean
  public emit (event: 'logout', data: string): boolean
  public emit (event: 'reconnect'): boolean
  public emit (event: never, data: string): never

  public emit (
    event: GrpcGatewayEvent,
    data?: string,
  ): boolean {
    return super.emit(event, data)
  }

  public on (event: 'add-friend-before-accept', listener: ((data: string) => any)): this
  public on (event: 'not-login', listener: ((data: string) => any)): this
  public on (event: 'contact-list', listener: ((data: string) => any)): this
  public on (event: 'new-friend', listener: ((data: string) => any)): this
  public on (event: 'add-friend', listener: ((data: string) => any)): this
  public on (event: 'room-member', listener: ((data: string) => any)): this
  public on (event: 'room-create', listener: ((data: string) => any)): this
  public on (event: 'room-join', listener: ((data: string) => any)): this
  public on (event: 'room-qrcode', listener: ((data: string) => any)): this
  public on (event: 'scan', listener: ((data: string) => any)): this
  public on (event: 'login', listener: ((data: string) => any)): this
  public on (event: 'message', listener: ((data: string) => any)): this
  public on (event: 'logout', listener: ((data: string) => any)): this
  public on (event: 'reconnect', listener: (() => any)): this
  public on (event: never, listener: ((data: string) => any)): never

  public on (
    event: GrpcGatewayEvent,
    listener: ((data: string) => any),
  ): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)
    super.on(event, (data: string) => {
      try {
        listener.call(this, data)
      } catch (e) {
        log.error(PRE, `onFunction(${event}) listener exception: ${e}`)
      }
    })
    return this
  }

  public async notify (apiName: string, data?: any) {
    log.silly(PRE, `notify(${apiName}, ${data})`)
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
      result.on('data', (data: StreamResponse) => {

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
      this.emit('reconnect')
    }
  }

}
