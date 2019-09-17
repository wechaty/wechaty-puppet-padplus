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
]

export type GrpcGatewayEvent = 'data' | 'grpc-error' | 'grpc-end' | 'grpc-close'

export class GrpcGateway extends EventEmitter {

  private static _instance?: GrpcGateway = undefined

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
    if (!this._instance.isAlive) {
      if (this._instance.longSocket) {
        this._instance.longSocket.removeAllListeners()
      }
      this._instance.client.close()
      this._instance = new GrpcGateway(token, endpoint)
    }
    return this._instance.addNewInstance(name)
  }

  private client: PadPlusServerClient
  private isAlive: boolean
  private longSocket?: grpc.ClientReadableStream<StreamResponse>

  private constructor (
    private token: string,
    private endpoint: string,
  ) {
    super()
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
    this.initGrpcGateway().catch(err => {
      throw new Error(err)
    })
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
  public emit (event: 'grpc-error'): boolean
  public emit (event: 'grpc-end' | 'grpc-close'): boolean
  public emit (event: never, data: any): never

  public emit (
    event: GrpcGatewayEvent,
    data?: StreamResponse,
  ): boolean {
    return super.emit(event, data)
  }

  public on (event: 'data', listener: ((data: StreamResponse) => any)): this
  public on (event: 'grpc-error', listener: (() => any)): this
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
      log.verbose(PRE, `request error : ${util.inspect(err)}`)
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

  public async initGrpcGateway () {
    log.silly(PRE, `notify()`)
    const initConfig = new InitConfig()
    initConfig.setToken(this.token)
    try {
      const longSocket = this.client.init(initConfig)
      log.silly(JSON.stringify(longSocket))

      longSocket.on('error', async (err: any) => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        log.error(PRE, err.stack)
        // process.exit(-1)
        this.isAlive = false
      })
      longSocket.on('end', async () => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        log.error(PRE, 'grpc server end.')
        process.exit(-1)
      })
      longSocket.on('close', () => {
        log.error(PRE, 'grpc server close')
      })
      longSocket.on('data', async (data: StreamResponse) => {
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
              const userName = JSON.parse(data.getData()!).userName
              const emitter = Object.values(this.eventEmitterMap).find(em => em.getUIN() === uin || em.getQrcodeId() === userName)
              if (!emitter) {
                return
              }
              emitter.emit('data', data)
            } catch (error) {
              throw new Error(error)
            }
          }

        }
      })

      await new Promise((resolve, reject) => {
        longSocket.once('connect', () => {
          log.silly(PRE, 'initLongSocket() Promise() longSocket.on(connect)')
          return resolve()
        })
        longSocket.once('error', (e) => {
          log.error(PRE, `initLongSocket() Promise() longSocket.on(error) ${e}`)
          Object.values(this.eventEmitterMap).map(emitter => {
            emitter.emit('grpc-error')
          })
        })
        longSocket.once('close', () => {
          log.silly(PRE, 'initLongSocket() Promise() longSocket.on(close)')
          this.emit('grpc-close')
          return reject(new Error('CLOSE'))
        })
        longSocket.once('end', () => {
          log.silly(PRE, `initLongSocket() Promise() longSocket.on(timeout)`)
          this.emit('grpc-end')
          return reject(new Error('TIMEOUT'))
        })
      })
      this.longSocket = longSocket
    } catch (err) {
      log.silly(PRE, `longsocket error : ${err}`)
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('grpc-error')
      })
    }
  }

}
