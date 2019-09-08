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
import fileBoxToQrcode from '../utils/file-box-to-qrcode'

import { GrpcGateway } from '../server-manager/grpc-gateway'
import { StreamResponse, ResponseType } from '../server-manager/proto-ts/PadPlusServer_pb'
import { ScanStatus, UrlLinkPayload } from 'wechaty-puppet'
import { RequestClient } from './api-request/request'
import { PadplusUser } from './api-request/user'
import { PadplusContact } from './api-request/contact'
// import { PadplusMessage } from './api-request/message'
import { GrpcEventEmitter } from '../server-manager/grpc-event-emitter'
import { PadplusMessagePayload, PadplusContactPayload, PadplusMessageType, PadplusUrlLink, ScanData, GrpcContactPayload } from '../schemas'
import { convertMessageFromGrpcToPadplus } from '../convert-manager/message-convertor'
import { GrpcMessagePayload, GrpcQrCodeLogin } from '../schemas/grpc-schemas';
import { CacheManager } from '../server-manager/cache-manager';
import { convertFromGrpcContact } from '../convert-manager/contact-convertor';

const MEMORY_SLOT_NAME = 'WECHATY_PUPPET_PADPLUS'

export interface PadplusMemorySlot {
  userName  : string,
  uin : string,
  qrcodeId: string,
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
  private grpcGateway        : GrpcGateway
  private readonly state     : StateSwitch
  private syncQueueExecutor  : DelayQueueExecutor
  private requestClient      : RequestClient
  private padplusUser        : PadplusUser
  // private padplusMesasge     : PadplusMessage
  private padplusContact     : PadplusContact
  private cacheManager?       : CacheManager
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
      uin: '',
      qrcodeId: '',
    }
    this.grpcGateway = GrpcGateway.Instance

    this.requestClient = new RequestClient(this.grpcGateway)
    this.padplusUser = new PadplusUser(this.requestClient)
    this.requestClient = new RequestClient(this.grpcGateway)
    // this.padplusMesasge = new PadplusMessage(this.requestClient)
    this.padplusContact = new PadplusContact(this.requestClient)
    this.syncQueueExecutor = new DelayQueueExecutor(1000)
    log.silly(PRE, ` : ${util.inspect(this.state)}, ${this.syncQueueExecutor}`)
  }

  public emit (event: 'scan', qrcode: string, status: number, data?: string): boolean
  public emit (event: 'login', data: GrpcQrCodeLogin): boolean
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
  public on (event: 'login', listener: ((this: PadplusManager, data: GrpcQrCodeLogin) => void)): this
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
    log.silly(PRE, `start()`)

    await this.parseGrpcData()
    // check login info in local memory card
    if (this.options.memory) {
      const slot = await this.options.memory.get(String(this.options.name))
      log.silly(`==P==A==D==P==L==U==S==<test slot>==P==A==D==P==L==U==S==`)
      log.silly(PRE, `slot : ${util.inspect(slot)}`)
    }
    const uin = this.grpcGatewayEmmiter.getUIN() // 从 memory card 中获取 uin 数据

    if (uin) {
      log.silly(PRE, `uin : ${util.inspect(uin)}`)
    } else {
      await this.padplusUser.getWeChatQRCode()
    }
    if (this.options.memory) {
      this.memorySlot = {
        ...this.memorySlot,
        ...await this.options.memory.get<PadplusMemorySlot>(MEMORY_SLOT_NAME),
      }
    }
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

            const fileBox = FileBox.fromBase64(qrcodeData.qrcode, `qrcode${(Math.random() * 10000).toFixed()}.png`)
            const qrcodeUrl = await fileBoxToQrcode(fileBox)
            this.emit('scan', qrcodeUrl, ScanStatus.Waiting)
          }
          break
        case ResponseType.QRCODE_SCAN :
          const scanRawData = data.getData()
          if (scanRawData) {
            log.silly(PRE, `QRCODE_SCAN : ${util.inspect(scanRawData)}`)
            const scanData: ScanData = JSON.parse(scanRawData)
            log.info(PRE, `
            =================================================
            QRCODE_SCAN MSG : ${scanData.msg}
            =================================================
            `)
            const status = scanData.status
            this.grpcGatewayEmmiter.setQrcodeId(scanData.qrcodeId)
            if (status !== 1) {
              this.memorySlot.qrcodeId = ''
            }
          }
          break
        case ResponseType.QRCODE_LOGIN :
          const grpcLoginData = data.getData()
          if (grpcLoginData) {
            log.silly(PRE, `QRCODE_LOGIN : ${util.inspect(grpcLoginData)}`)
            const loginData: GrpcQrCodeLogin = JSON.parse(grpcLoginData)
            this.grpcGatewayEmmiter.setQrcodeId('')
            this.grpcGatewayEmmiter.setUserName(loginData.userName)
            this.grpcGatewayEmmiter.setUIN(loginData.uin)

            log.verbose(PRE, `init cache manager`)
            await CacheManager.init(loginData.userName)
            this.cacheManager = CacheManager.Instance

            this.emit('login', loginData)
          }
          break
        case ResponseType.ACCOUNT_LOGIN :
          /*const loginRawData = data.getData()
          // TODO: convert data from grpc to padplus
           if (loginRawData) {
            const grpcLoginData: GrpcLoginData = JSON.parse(loginRawData)
            // const loginData = convertLoginData(grpcLoginData)
            this.emit('login', grpcLoginData)
          } */
          break
        case ResponseType.ACCOUNT_LOGOUT :
          const looutRawData = data.getData()
          if (looutRawData) {
            this.emit('logout', looutRawData)
          }
          break
        case ResponseType.CONTACT_LIST :
          const grpcContact = data.getData()
          if (grpcContact) {
            const _contact: GrpcContactPayload = JSON.parse(grpcContact)
            log.silly(PRE, `contact list : ${util.inspect(_contact)}`)
            const contact = convertFromGrpcContact(_contact)

            if (this.cacheManager) {
              this.cacheManager.setContact(contact.userName, contact)
            }
          }
          break
        case ResponseType.CONTACT_MODIFY :
          const contactModify = data.getData()
          // TODO: 查找该联系人的信息并更新
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
            const rawMessageStr = data.getData()
            // TODO: convert data from grpc to padplus
            if (rawMessageStr) {
              const rawMessage: GrpcMessagePayload = JSON.parse(rawMessageStr)
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

  public async sendMessage (wxid: string, receiver: string, text: string, type: PadplusMessageType) {
    // await this.padplusMesasge.sendMessage(wxid, receiver, text, type)
    log.silly(PRE, ` : ${wxid}, : ${receiver}, : ${text}, : ${type}`)
  }

  public async sendContact (wxid: string, receiver: string, contactId: string) {
    log.silly(PRE, ` : ${wxid}, : ${receiver}, : ${contactId}`)
    // await this.padplusMesasge.sendContact(wxid, receiver, contactId)
  }

  public async generatorFileUrl (file: FileBox): Promise<string> {
    log.verbose(PRE, 'generatorFileUrl(%s)', file)
    const url = await this.requestClient.uploadFile(file.name, await file.toStream())
    return url
  }

  public async sendUrlLink (wxid: string, receiver: string, urlLinkPayload: UrlLinkPayload) {
    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload: PadplusUrlLink = {
      description,
      thumbnailUrl,
      title,
      url,
    }
    log.silly(PRE, ` : ${wxid}, : ${receiver}, : ${payload}`)

    // await this.padplusMesasge.sendUrlLink(wxid, receiver, payload)
  }

  private async onProcessMessage (rawMessage: any): Promise<PadplusMessagePayload> {
    const payload: PadplusMessagePayload = await convertMessageFromGrpcToPadplus(rawMessage)
    this.cachePadplusMessagePayload.set(payload.msgId, payload)
    return payload
  }

  /**
   * 
   * contact
   * 
   */

  public async setContactAlias(
    selfId: string,
    contactId: string,
    alias: string,
  ): Promise<void> {
    this.padplusContact.setAlias(selfId, contactId, alias)
  }

  public async getContactIdList (
    selfId: string,
  ): Promise<string[]> {
    log.silly(PRE, `selfId : ${util.inspect(selfId)}`)
    // TODO get contact from cache
    const contacts: string[] = [];
    // const result = contacts.map(c => c.userName)
    const result = contacts;
    return result;
  }

  public async getRawContact (
    selfId: string,
    contactId: string,
  ): Promise<PadplusContactPayload> {
    // TODO: get contact from cache.
    let contact: PadplusContactPayload;
    // if (!contact) {
    contact = await this.padplusContact.getContactInfo(selfId, contactId);
    // }
    // TODO set contact cache.
    return contact
  }

  public async syncContacts (): Promise<void> {
    await this.padplusContact.syncContacts(this.grpcGatewayEmmiter.getUIN())
  }

  // public async getContact (
  //   selfId: string,
  //   contactId: string,
  // ) {
  //   // TODO: get contact from cache.
  //   let contact: PadplusContactPayload;
  //   // if (!contact) {
  //   contact = await this.padplusContact.getContactInfo(selfId, contactId);
  //   // }
  //   // TODO set contact cache.
  //   const rawContact = convertToPuppetContact(contact)
  //   return rawContact
  // }
  
  /**
   * 
   * room
   * 
   */
  
   /**
    * 
    * messages
    * 
    */
}


export default PadplusManager
