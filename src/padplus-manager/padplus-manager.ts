import util from 'util'
import {
  DelayQueueExecutor,
}                             from 'rx-queue'
import { StateSwitch }        from 'state-switch'
import { log, GRPC_ENDPOINT, MESSAGE_CACHE_MAX, MESSAGE_CACHE_AGE } from '../config'
// import { CacheManager } from '../server-manager/cache-manager'
import { MemoryCard } from 'memory-card'
import FileBox from 'file-box'
import LRU from 'lru-cache'

import { GrpcGateway } from '../server-manager/grpc-gateway';
import { StreamResponse, ResponseType } from '../server-manager/proto-ts/PadPlusServer_pb';
import { ScanStatus } from 'wechaty-puppet';
import { RequestClient } from './api-request/request';
import { PadplusUser } from './api-request/user-api';
import { GrpcEventEmitter } from '../server-manager/grpc-event-emitter';
import { PadplusMessagePayload } from '../schemas';
import { convertMessageFromGrpcToPadplus } from '../convert-manager/message-convertor';

const MEMORY_SLOT_NAME = 'WECHATY_PUPPET_PADPLUS'

export interface PadplusMemorySlot {
  userName  : string,
  uin : number,
  qrcodeId: number,
}

export interface ManagerOptions {
  memory?: MemoryCard,
  token: string,
  name: unknown,
}

const PRE = 'PadplusManager'

export type PadplusManagerEvent = 'scan' | 'login' | 'logout' | 'contact-list' | 'contact-modify' | 'contact-delete' | 'message' | 'room-member-list' | 'room-member-modify' | 'status-notify'

export class PadplusManager {

  private grpcGatewayEmmiter : GrpcEventEmitter
  private grpcGateway       : GrpcGateway
  private readonly state     : StateSwitch
  private syncQueueExecutor  : DelayQueueExecutor
  private request            : RequestClient
  private padplusUser        : PadplusUser

  private memorySlot: PadplusMemorySlot
  public readonly cachePadplusMessagePayload: LRU<string, PadplusMessagePayload>

  constructor (
    public options: ManagerOptions,
  ) {
    log.verbose(PRE, 'constructor()')
    const lruOptions: LRU.Options<string, PadplusMessagePayload> = {
      dispose (key: string, val: any) {
        log.silly(PRE, `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      },
      max: MESSAGE_CACHE_MAX,
      maxAge: MESSAGE_CACHE_AGE,
    }

    this.cachePadplusMessagePayload = new LRU<string, PadplusMessagePayload>(lruOptions)

    this.state = new StateSwitch('PadplusManager')
    this.grpcGatewayEmmiter = GrpcGateway.init(options.token, GRPC_ENDPOINT, String(options.name))
    if (!GrpcGateway.Instance) {
      throw new Error(`The grpc gateway has no instance.`)
    }
    this.memorySlot = {
      userName: '',
      uin: 0,
      qrcodeId: 0,
    }
    this.grpcGateway = GrpcGateway.Instance
    this.request = new RequestClient(this.grpcGateway)
    this.padplusUser = new PadplusUser(this.request)
    this.syncQueueExecutor = new DelayQueueExecutor(1000)
    log.silly(PRE, ` : ${util.inspect(this.state)}, ${this.syncQueueExecutor}`)
  }

  public emit (event: 'scan', qrcode: string, status: number, data?: string): boolean
  public emit (event: 'login', userIdOrReasonOrData: string): boolean
  public emit (event: 'logout', userIdOrReasonOrData: string): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: 'contact-modify', data: string): boolean
  public emit (event: 'contact-delete', data: string): boolean
  public emit (event: 'message', data: PadplusMessagePayload): boolean
  public emit (event: 'room-member-list', data: string): boolean
  public emit (event: 'room-member-modify', data: string): boolean
  public emit (event: 'status-notify', data: string): boolean
  public emit (event: never, listener: never): never

  public emit (
    event: PadplusManagerEvent,
    ...args: any[]
  ): boolean {
    return this.grpcGatewayEmmiter.emit(event, ...args)
  }

  public on (event: 'scan', listener: ((this: PadplusManager, qrcode: string, status: number, data?: string) => void)): this
  public on (event: 'login', listener: ((this: PadplusManager, userIdOrReasonOrData: string) => void)): this
  public on (event: 'logout', listener: ((this: PadplusManager, userIdOrReasonOrData: string) => void)): this
  public on (event: 'contact-list', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'contact-modify', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'contact-delete', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'message', listener: ((this: PadplusManager, data: PadplusMessagePayload) => void)): this
  public on (event: 'room-member-list', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'room-member-modify', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'status-notify', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: never, listener: never): never

  public on (event: PadplusManagerEvent, listener: ((...args: any[]) => any)): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)

    this.grpcGatewayEmmiter.on(event, (...args: any[]) => {
      try {
        listener.apply(this, args)
      } catch (e) {
        log.error(PRE, 'onFunction(%s) listener exception: %s', event, e)
      }
    })

    return this
  }

  public async start (): Promise<void> {
    await this.padplusUser.getQrcode()
    if (this.options.memory) {
      this.memorySlot = {
        ...this.memorySlot,
        ...await this.options.memory.get<PadplusMemorySlot>(MEMORY_SLOT_NAME),
      }
    }
    await this.parseGrpcData()
  }

  public async parseGrpcData () {
    this.grpcGatewayEmmiter.on('data', async (data: StreamResponse) => {
      const type = data.getResponsetype()
      switch (type) {
        case ResponseType.LOGIN_QRCODE :
          const qrcodeRawData = data.getData()
          if (qrcodeRawData) {
            log.silly(PRE, `LOGIN_QRCODE : ${util.inspect(qrcodeRawData)}`)
            const qrcodeData = JSON.parse(qrcodeRawData)
            this.memorySlot.qrcodeId = qrcodeData.qrcodeId
            this.grpcGatewayEmmiter.setQrcodeId(qrcodeData.qrcodeId)
            // 保存QRCode
            const fileBox = FileBox.fromBase64(qrcodeData.qrcode, `qrcode${(Math.random() * 1000).toFixed()}.png`)
            await fileBox.toFile()
            this.emit('scan', qrcodeData, ScanStatus.Waiting)
          }
          break
        case ResponseType.QRCODE_SCAN :
          const scanRawData = data.getData()
          if (scanRawData) {
            log.silly(PRE, `QRCODE_SCAN : ${util.inspect(scanRawData)}`)
            const scanData = JSON.parse(scanRawData)
            const status = scanData.status
            if (status !== 1) {
              this.memorySlot.qrcodeId = 0
            }
          }
          break
        case ResponseType.ACCOUNT_LOGIN :
          const loginRawData = data.getData()
          // TODO: convert data from grpc to padplus
          if (loginRawData) {
            this.emit('login', loginRawData)
          }
          break
        case ResponseType.ACCOUNT_LOGOUT :
          const looutRawData = data.getData()
          // TODO: convert data from grpc to padplus, E.G. : convert.scanQrcodeConvert()
          if (looutRawData) {
            this.emit('logout', looutRawData)
          }
          break
        case ResponseType.CONTACT_LIST :
          const contactList = data.getData()
          // TODO: convert data from grpc to padplus
          if (contactList) {
            this.emit('contact-list', contactList)
          }
          break
        case ResponseType.CONTACT_MODIFY :
          const contactModify = data.getData()
          // TODO: convert data from grpc to padplus
          if (contactModify) {
            this.emit('contact-modify', contactModify)
          }
          break
        case ResponseType.CONTACT_DELETE :
          const contactDelete = data.getData()
          // TODO: convert data from grpc to padplus
          if (contactDelete) {
            this.emit('contact-delete', contactDelete)
          }
          break
          case ResponseType.MESSAGE_RECEIVE :
            const rawMessage = data.getData()
            // TODO: convert data from grpc to padplus
            if (rawMessage) {
              const message: PadplusMessagePayload = await this.onProcessMessage(rawMessage)
              this.emit('message', message)
            }
            break
          case ResponseType.ROOM_MEMBER_LIST :
            const roomMemberList = data.getData()
            // TODO: convert data from grpc to padplus
            if (roomMemberList) {
              this.emit('room-member-list', roomMemberList)
            }
            break
          case ResponseType.ROOM_MEMBER_MODIFY :
            const roomMemberModify = data.getData()
            // TODO: convert data from grpc to padplus
            if (roomMemberModify) {
              this.emit('room-member-modify', roomMemberModify)
            }
            break
          case ResponseType.STATUS_NOTIFY :
            const statusNotify = data.getData()
            // TODO: convert data from grpc to padplus
            if (statusNotify) {
              this.emit('status-notify', statusNotify)
            }
            break
      }
    })
  }

  /**
   * Contact Section
   */


  /**
   * Message Section
   */

  private async onProcessMessage (rawMessage: any): Promise<PadplusMessagePayload> {
    // TODO: 处理所有消息信息 1. 数据转换  2. 类型处理
    const messageId = ''
    const payload: PadplusMessagePayload = convertMessageFromGrpcToPadplus(rawMessage)
    this.cachePadplusMessagePayload.set(messageId, payload)
    return {} as PadplusMessagePayload
  }
}

export default PadplusManager
