import {
  DelayQueueExecutor,
}                             from 'rx-queue'
import { StateSwitch }        from 'state-switch'

import { log, GRPC_ENDPOINT } from '../config'
import { CacheManager } from '../server-manager/cache-manager'

import { GrpcGateway } from '../server-manager/grpc-gateway';
import { EventEmitter } from 'events';
import { StreamResponse, ResponseType } from '../server-manager/proto-ts/PadPlusServer_pb';
import { ScanStatus } from 'wechaty-puppet';

export interface ManagerOptions {
  token    : string,
}

const PRE = 'PadplusManager'

export type PadplusManagerEvent = 'scan' | 'login' | 'logout' | 'contact-list'

export class PadplusManager extends EventEmitter {

  private grpcGateway      : GrpcGateway
  private readonly state   : StateSwitch

  private syncQueueExecutor: DelayQueueExecutor

  constructor (
    public options: ManagerOptions,
  ) {
    super()
    log.verbose(PRE, 'constructor()')

    this.state = new StateSwitch('PadplusManager')
    this.grpcGateway = new GrpcGateway(options.token, GRPC_ENDPOINT)

    this.syncQueueExecutor = new DelayQueueExecutor(1000)
  }

  public emit (event: 'scan', qrcode: string, status: number, data?: string): boolean
  public emit (event: 'login', userIdOrReasonOrData: string): boolean
  public emit (event: 'logout', userIdOrReasonOrData: string): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: never, listener: never): never

  public emit (
    event: PadplusManagerEvent,
    ...args: any[]
  ): boolean {
    return super.emit(event, ...args)
  }

  public on (event: 'scan', listener: ((this: PadplusManager, qrcode: string, status: number, data?: string) => void)): this
  public on (event: 'login', listener: ((this: PadplusManager, userIdOrReasonOrData: string) => void)): this
  public on (event: 'logout', listener: ((this: PadplusManager, userIdOrReasonOrData: string) => void)): this
  public on (event: 'contact-list', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: never, listener: never): never

  public on (event: PadplusManagerEvent, listener: ((...args: any[]) => any)): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)

    super.on(event, (...args: any[]) => {
      try {
        listener.apply(this, args)
      } catch (e) {
        log.error(PRE, 'onFunction(%s) listener exception: %s', event, e)
      }
    })

    return this
  }

  public async start (): Promise<void> {
    await this.grpcGateway.initGrpcGateway()

    await this.parseGrpcData()
  }

  public async parseGrpcData () {
    this.grpcGateway.on('data', (data: StreamResponse) => {
      const type = data.getResponsetype()
      switch (type) {
        case ResponseType.LOGIN_QRCODE :
          const qrcodeRawData = data.getData()
          // TODO: convert data from grpc to padplus, E.G. : convert.scanQrcodeConvert()
          if (qrcodeRawData) {
            this.emit('scan', qrcodeRawData, ScanStatus.Waiting)
          }
          break
        case ResponseType.QRCODE_SCAN :
          const scanRawData = data.getData()
          // TODO: convert data from grpc to padplus, E.G. : convert.scanQrcodeConvert()

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
      }
    })
  }
}

export default PadplusManager
