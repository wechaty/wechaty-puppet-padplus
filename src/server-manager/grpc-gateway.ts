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
import { DebounceQueue, ThrottleQueue } from 'rx-queue'
import { Subscription } from 'rxjs'

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
  ApiType.HEARTBEAT,
  ApiType.CREATE_TAG,
  ApiType.ADD_TAG,
  ApiType.MODIFY_TAG,
  ApiType.DELETE_TAG,
  ApiType.GET_ALL_TAG,
  ApiType.GET_ROOM_QRCODE,
  ApiType.GET_CONTACT_SELF_QRCODE,
  ApiType.SET_CONTACT_SELF_INFO,
  ApiType.GET_CONTACT_SELF_INFO,
  ApiType.LOGOUT,
  ApiType.REVOKE_MESSAGE,
  ApiType.ACCEPT_ROOM_INVITATION,
]

export type GrpcGatewayEvent = 'data' | 'reconnect' | 'grpc-end' | 'grpc-close' | 'heartbeat'

export class GrpcGateway extends EventEmitter {

  private static _instance?: GrpcGateway = undefined

  private debounceQueue?: DebounceQueue
  private debounceQueueSubscription?: Subscription
  private throttleQueue?: ThrottleQueue
  private throttleQueueSubscription?: Subscription

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
      const instance = new GrpcGateway(token, endpoint)
      await instance.initSelf()
      this._instance = instance
    } else if (!this._instance.isAlive) {
      await this._instance.stop()
      const instance = new GrpcGateway(token, endpoint)
      await instance.initSelf()
      this._instance = instance
    }

    return this._instance.addNewInstance(name)
  }

  private async keepHeartbeat () {
    log.silly(PRE, `keepHeartbeat()`)

    try {
      const res = await this.request(ApiType.HEARTBEAT, '')
      if (!res) {
        throw new Error(`no heartbeat response from grpc server`)
      }
    } catch (error) {
      log.error(PRE, `can not get heartbeat from grpc server`, error)
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('reconnect')
      })
    }
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
  private timeoutNumber: number
  private startTime: number
  private stream?: grpc.ClientReadableStream<StreamResponse>
  private reconnectStatus: boolean

  private constructor (
    private token: string,
    private endpoint: string,
  ) {
    super()
    this.stopping = false
    this.client = new PadPlusServerClient(this.endpoint, grpc.credentials.createInsecure())
    this.isAlive = false
    this.reconnectStatus = true
    this.timeoutNumber = 0
    this.startTime = Date.now()
  }

  private async initSelf () {
    this.debounceQueue = new DebounceQueue(30 * 1000)
    this.debounceQueueSubscription = this.debounceQueue.subscribe(async () => {
      try {
        await this.keepHeartbeat()
      } catch (e) {
        log.silly(PRE, `debounce error : ${util.inspect(e)}`)
      }
    })

    this.throttleQueue = new ThrottleQueue(15 * 1000)
    this.throttleQueueSubscription = this.throttleQueue.subscribe((data) => {
      log.silly(PRE, `throttleQueue emit heartbeat.`)
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('heartbeat', data.getRequestid())
      })
    })
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
  public emit (event: 'heartbeat', requestId: any): boolean
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
  public on (event: 'heartbeat', listener: ((requestId: any) => any)): this
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

  private async checkTimeout (uin: string) {
    if (this.timeoutNumber > 10 && Date.now() - this.startTime <= 3 * 60 * 1000) {
      await this.request(
        ApiType.RECONNECT,
        uin,
      )
      this.startTime = Date.now()
      this.timeoutNumber = 0
    } else if (this.timeoutNumber === 0) {
      this.startTime = Date.now()
    } else if (Date.now() - this.startTime > 3 * 60 * 1000) {
      this.startTime = Date.now()
      this.timeoutNumber = 0
    }
    this.timeoutNumber++
  }

  public async request (apiType: ApiType, uin: string, data?: any): Promise<StreamResponse | null> {
    const request = new RequestObject()
    const requestId = uuid()
    log.silly(PRE, `GRPC Request ApiType: ${apiType}`)
    request.setToken(this.token)
    if (uin !== '') {
      request.setUin(uin)
    }
    request.setApitype(apiType)
    request.setParams(JSON.stringify(data))
    request.setRequestid(requestId)
    const traceId = uuid()
    request.setTraceid(traceId)

    try {
      const result = await this._request(request)
      if (result && NEED_CALLBACK_API_LIST.includes(apiType)) {
        return new Promise(resolve => {
          let timeoutMs = 30 * 1000
          switch (apiType) {
            case ApiType.SEND_MESSAGE:
            case ApiType.SEND_FILE:
              timeoutMs = 3 * 60 * 1000
              break
            case ApiType.GET_MESSAGE_MEDIA:
              timeoutMs = 5 * 60 * 1000
              break
            case ApiType.SEARCH_CONTACT:
            case ApiType.ADD_CONTACT:
            case ApiType.CREATE_ROOM:
            case ApiType.GET_ROOM_QRCODE:
              timeoutMs = 1 * 60 * 1000
              break
            default:
              timeoutMs = 30 * 1000
              break
          }
          const timeout = setTimeout(async () => {
            if (apiType !== ApiType.HEARTBEAT) {
              await this.checkTimeout(uin)
            }
            log.error(PRE, `ApiType: ${apiType} request timeout, traceId: ${traceId}`)
            resolve(null)
          }, timeoutMs)
          CallbackPool.Instance.pushCallbackToPool(traceId, (data: StreamResponse) => {
            const _traceId = data.getTraceid()
            if (!_traceId) {
              log.error(PRE, `Can not get trace id by type: ${apiType}`)
            }
            if (traceId === _traceId) {
              clearTimeout(timeout)
              if (apiType !== ApiType.HEARTBEAT) {
                this.timeoutNumber = 0
              }
              resolve(data)
            }
          })
        })
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      this.isAlive = false
      this.client.close()
      Object.values(this.eventEmitterMap).map(emitter => {
        emitter.emit('reconnect')
      })
      if (err.details === 'INVALID_TOKEN') {
        padplusToken()
      }
    }
    return null
  }

  private async _request (request: RequestObject): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
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
      } catch (error) {
        throw new Error(`can not get response data of grpc request`)
      }
    })
  }

  public async stop () {
    log.silly(PRE, `stop()`)
    if (this.stream) {
      this.stream.destroy()
      this.stream.removeAllListeners()
    }
    this.client.close()

    this.stopping = true
    try {
      await this.request(ApiType.CLOSE, '')
    } catch (error) {
      log.error(PRE, `error : ${util.inspect(error)}`)
    }

    if (!this.throttleQueueSubscription || !this.debounceQueueSubscription) {
      log.verbose(PRE, `releaseQueue() subscriptions have been released.`)
    } else {
      this.throttleQueueSubscription.unsubscribe()
      this.debounceQueueSubscription.unsubscribe()

      this.throttleQueueSubscription = undefined
      this.debounceQueueSubscription = undefined
    }

    if (!this.debounceQueue || !this.throttleQueue) {
      log.verbose(PRE, `releaseQueue() queues have been released.`)
    } else {
      this.debounceQueue.unsubscribe()
      this.throttleQueue.unsubscribe()

      this.debounceQueue = undefined
      this.throttleQueue = undefined
    }
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
      if (err.code === 14 || err.code === 13 || err.code === 2) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        this.isAlive = false
        Object.values(this.eventEmitterMap).map(emitter => {
          emitter.emit('reconnect')
        })
      } else {
        log.error(PRE, `stream error:`, util.inspect(err))
      }
    })
    stream.on('end', async () => {
      if (this.reconnectStatus) {
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
      } else {
        log.info(PRE, `
        =====================================================================
                   DUPLICATE CONNECTED, THIS THREAD WILL EXIT NOW
        =====================================================================
        `)
        process.exit()
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
      const traceId = data.getTraceid()
      const responseType = data.getResponsetype()
      if (responseType !== ResponseType.LOGIN_QRCODE && responseType !== ResponseType.ROOM_QRCODE && responseType !== ResponseType.CONTACT_SELF_QRCODE_GET) {
        log.silly(`==P==A==D==P==L==U==S==<GRPC DATA>==P==A==D==P==L==U==S==`)
        log.silly(PRE, `responseType: ${responseType}, data : ${data.getData()}`)
        log.silly(`==P==A==D==P==L==U==S==<GRPC DATA>==P==A==D==P==L==U==S==\n`)
      }
      if (this.debounceQueue && this.throttleQueue) {
        this.debounceQueue.next(data)
        this.throttleQueue.next(data)
      }
      let message = ''
      const _data = data.getData()
      if (_data) {
        try {
          message = JSON.parse(_data).message
        } catch (error) {
          log.error(PRE, `can not parse data`)
        }
      }
      if (message && message === 'Another instance connected, disconnected the current one.') {
        this.reconnectStatus = false
      } else if (message && message === 'EXPIRED_TOKEN') {
        Object.values(this.eventEmitterMap).map(emitter => {
          this.reconnectStatus = false
          emitter.emit('EXPIRED_TOKEN')
        })
      } else if (message && message === 'INVALID_TOKEN') {
        Object.values(this.eventEmitterMap).map(emitter => {
          this.reconnectStatus = false
          emitter.emit('INVALID_TOKEN')
        })
      }
      if (traceId) {
        let callback = CallbackPool.Instance.getCallback(traceId)

        if (callback) {
          callback(data)
          CallbackPool.Instance.removeCallback(traceId)
        } else {
          await new Promise(resolve => {
            setTimeout(resolve, 500)
          })
          try {
            callback = CallbackPool.Instance.getCallback(traceId)
            callback(data)
            CallbackPool.Instance.removeCallback(traceId)
          } catch (error) {
            throw new Error(`can not find callback by traceId : ${traceId}`)
          }
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

            if (responseType === ResponseType.QRCODE_SCAN && user.status === 3 && user.qrcodeId !== emitter.getQrcodeId()) {
              return
            } else {
              emitter.emit('data', data)
            }
          } catch (error) {
            throw new Error(`can not parse json data from grpc server.`)
          }
        }

      }
    })
    this.stream = stream
  }

}
