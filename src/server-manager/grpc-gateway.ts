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
  ResponseType,
} from './proto-ts/PadPlusServer_pb'
import { EventEmitter } from 'events'
import { GrpcEventEmitter } from './grpc-event-emitter'

export interface ResultObject {
  code: number,
  data: any,
}

const PRE = 'GRPC_GATEWAY'
const NEED_CALLBACK_API_LIST: ApiType[] = [
  ApiType.SEND_MESSAGE,
  ApiType.SEND_FILE,
  ApiType.GET_MESSAGE_MEDIA,
  ApiType.SEARCH_CONTACT,
  ApiType.ADD_CONTACT,
  ApiType.CREATE_ROOM,
  ApiType.GET_ROOM_ANNOUNCEMENT,
  ApiType.SET_ROOM_ANNOUNCEMENT,
]

export type GrpcGatewayEvent = 'data' | 'reconnect' | 'grpc-end' | 'grpc-close'

export class GrpcGateway extends EventEmitter {

  private static _instance?: GrpcGateway = undefined

  public static counter: number = 0

  public static get Instance () {
    return this._instance
  }

  private eventEmitterMap: { [name: string]: GrpcEventEmitter } = {}

  public static async init (
    token: string,
    endpoint: string,
    name: string,
  ): Promise<GrpcEventEmitter> {
    if (!this._instance) {
      this._instance = new GrpcGateway(token, endpoint)
      await this._instance.initSelf()
    }
    if (!this._instance.isAlive) {
      if (this._instance.stream) {
        this._instance.stream.removeAllListeners()
      }
      this._instance.client.close()
      this._instance = new GrpcGateway(token, endpoint)
      await this._instance.initSelf()
    }
    return this._instance.addNewInstance(name)
  }

  public static async release () {
    if (this._instance) {
      await this._instance.stop()
      this._instance = undefined
    }
  }

  private client: PadPlusServerClient
  private stopping: boolean
  private isAlive: boolean
  private stream?: grpc.ClientReadableStream<StreamResponse>

  private constructor (
    private token: string,
    private endpoint: string,
  ) {
    super()
    this.stopping = false
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
    this.isAlive = false
  }

  private async initSelf () {
    await this.initGrpcGateway()
    this.isAlive = true
  }

  private addNewInstance (
    name: string,
  ): GrpcEventEmitter {
    const eventEmitter = new GrpcEventEmitter(name)
    this.eventEmitterMap[name] = eventEmitter
    return eventEmitter
  }

  public emit (event: 'data', data: StreamResponse): boolean
  public emit (event: 'reconnect'): boolean
  public emit (event: 'grpc-end' | 'grpc-close'): boolean
  public emit (event: never, data: any): never

  public emit (
    event: GrpcGatewayEvent,
    data?: StreamResponse,
  ): boolean {
    return super.emit(event, data)
  }

  public on (event: 'data', listener: ((data: StreamResponse) => any)): this
  public on (event: 'reconnect', listener: (() => any)): this
  public on (event: 'grpc-end' | 'grpc-close', listener: (() => any)): this
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

  public async request (apiType: ApiType, uin: string, data?: any): Promise<StreamResponse | null> {
    const request = new RequestObject()
    const requestId = uuid()
    log.silly(PRE, `GRPC : token: ${this.token}, apiType: ${apiType}, uin : ${uin}, ${JSON.stringify(data)}`)
    request.setToken(this.token)
    if (uin !== '') {
      request.setUin(uin)
    }
    request.setApitype(apiType)
    request.setParams(JSON.stringify(data))
    request.setRequestid(requestId)

    try {
      const result = await this._request(request)
      if (result && NEED_CALLBACK_API_LIST.includes(apiType)) {
        if (apiType === ApiType.GET_MESSAGE_MEDIA) {
          return new Promise<StreamResponse>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('request timeout')), 5000)
            CallbackPool.Instance.pushCallbackToPool(data.msgId, (data: StreamResponse) => {
              clearTimeout(timeout)
              resolve(data)
            })
          })
        } else if (apiType === ApiType.SEARCH_CONTACT) {
          return new Promise<StreamResponse>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('request timeout')), 5000)
            CallbackPool.Instance.pushCallbackToPool(data.wxid, (data: StreamResponse) => {
              clearTimeout(timeout)
              resolve(data)
            })
          })
        } else if (apiType === ApiType.ADD_CONTACT) {
          return new Promise<StreamResponse>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('request timeout')), 5000)
            CallbackPool.Instance.pushCallbackToPool(data.userName, (data: StreamResponse) => {
              clearTimeout(timeout)
              resolve(data)
            })
          })
        } else {
          return new Promise<StreamResponse>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('request timeout')), 5000)
            CallbackPool.Instance.pushCallbackToPool(requestId, (data: StreamResponse) => {
              clearTimeout(timeout)
              resolve(data)
            })
          })
        }
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      this.isAlive = false
      this.client.close()
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('grpc-error')
      })
      if (err.details === 'INVALID_TOKEN') {
        padplusToken()
      }
    }
    return null
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
              resolve(true)
            } else {
              reject(err)
            }
          }
        }
      )
    })
  }

  public async stop () {
    log.silly(PRE, `stop()`)
    if (this.stream) {
      this.stream.destroy()
      this.stream.removeAllListeners()
    }

    this.stopping = true
    await this.request(ApiType.CLOSE, '')
  }

  public async initGrpcGateway () {
    log.silly(PRE, `initGrpcGateway()`)
    const initConfig = new InitConfig()
    initConfig.setToken(this.token)

    const channel = this.client.getChannel()
    if (channel) {
      await new Promise((resolve, reject) => {
        channel.getConnectivityState(true)
        const beforeState = channel.getConnectivityState(false)
        channel.watchConnectivityState(beforeState, Date.now() + 5000, (err) => {
          if (err) {
            reject(new Error('Try to connect to server timeout.'))
          } else {
            const state = channel.getConnectivityState(false)
            if (state !== grpc.connectivityState.READY) {
              reject(new Error(`Failed to connect to server, state changed to ${state}`))
            } else {
              resolve()
            }
          }
        })
      })
    } else {
      throw new Error('No channel for grpc client.')
    }

    const stream = this.client.init(initConfig)

    stream.on('error', async (err: any) => {
      log.error(PRE, `GRPC SERVER ERROR.
      =====================================================================
      try to reconnect grpc server, waiting...
      =====================================================================
      `)
      if (err.code === 14 || err.code === 13) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        this.isAlive = false
        Object.values(this.eventEmitterMap).map(emitter => {
          emitter.emit('reconnect')
        })
      } else {
        log.error(PRE, util.inspect(err.stack))
      }
    })
    stream.on('end', async () => {
      log.error(PRE, `GRPC SERVER END.
      =====================================================================
      try to reconnect grpc server, waiting...
      =====================================================================
      `)
      await new Promise(resolve => setTimeout(resolve, 5000))
      this.isAlive = false
      if (!this.stopping) {
        Object.values(this.eventEmitterMap).map(emitter => {
          emitter.emit('reconnect')
        })
      }
    })
    stream.on('close', async () => {
      log.error(PRE, 'GRPC SERVER CLOSE')
      this.isAlive = false
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('reconnect')
      })
    })
    stream.on('data', async (data: StreamResponse) => {
      const requestId = data.getRequestid()
      const responseType = data.getResponsetype()
      if (responseType !== ResponseType.LOGIN_QRCODE) {
        log.silly(`==P==A==D==P==L==U==S==<GRPC DATA>==P==A==D==P==L==U==S==`)
        log.silly(PRE, `responseType: ${responseType}, data : ${data.getData()}`)
        log.silly(`==P==A==D==P==L==U==S==<GRPC DATA>==P==A==D==P==L==U==S==\n`)
      }

      if (requestId) {
        const callback = CallbackPool.Instance.getCallback(requestId)
        if (callback) {
          callback(data)
          CallbackPool.Instance.removeCallback(requestId)
        }
      } else {
        if (responseType === ResponseType.LOGIN_QRCODE) {
          const name = Object.keys(this.eventEmitterMap).find(name => {
            const qrcodeId = this.eventEmitterMap[name].getQrcodeId()
            const uin = this.eventEmitterMap[name].getUIN()
            const userName = this.eventEmitterMap[name].getUserName()
            log.silly(PRE, `uin : ${uin}, userName: ${userName}`)
            return qrcodeId === '' && uin === '' && userName === ''
          })
          if (name) {
            this.eventEmitterMap[name].emit('data', data)
          }
        } else {
          const uin = data.getUin()
          try {
            const user = JSON.parse(data.getData()!)
            const userName = user.userName
            const emitter = Object.values(this.eventEmitterMap).find(em => em.getUIN() === uin || em.getQrcodeId() === userName)
            if (!emitter) {
              return
            }
            emitter.emit('data', data)
          } catch (error) {
            throw new Error(`can not parse json data from grpc server.`)
          }
        }

      }
    })
    this.stream = stream
  }

}
