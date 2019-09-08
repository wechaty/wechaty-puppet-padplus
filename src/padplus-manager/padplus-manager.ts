import util from 'util'
import {
  DelayQueueExecutor,
}                             from 'rx-queue'
import { StateSwitch }        from 'state-switch'
import { log, GRPC_ENDPOINT, MESSAGE_CACHE_MAX, MESSAGE_CACHE_AGE } from '../config'
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
import { PadplusMessage } from './api-request/message'
import { GrpcEventEmitter } from '../server-manager/grpc-event-emitter'
import { PadplusMessagePayload, PadplusContactPayload, PadplusMessageType, ScanData, GrpcContactPayload, PadplusRoomPayload, PadplusError, PadplusErrorType, GrpcRoomPayload } from '../schemas'
import { convertMessageFromGrpcToPadplus } from '../convert-manager/message-convertor'
import { GrpcMessagePayload, GrpcQrCodeLogin } from '../schemas/grpc-schemas'
import { CacheManager } from '../server-manager/cache-manager'
import { convertFromGrpcContact } from '../convert-manager/contact-convertor'
import { PadplusRoom } from './api-request/room'
import { convertRoomFromGrpc } from '../convert-manager/room-convertor';
import { CallbackPool } from '../utils/callbackHelper';

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
  private padplusMesasge     : PadplusMessage
  private padplusContact     : PadplusContact
  private padplusRoom        : PadplusRoom
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

    this.requestClient = new RequestClient(this.grpcGateway) // TODO: 将 this.grpcGatewayEmmiter 传入，用来获取 uin
    this.padplusUser = new PadplusUser(this.requestClient, this.grpcGatewayEmmiter)
    this.padplusMesasge = new PadplusMessage(this.requestClient, this.grpcGatewayEmmiter)
    this.padplusContact = new PadplusContact(this.requestClient, this.grpcGatewayEmmiter)
    this.padplusRoom = new PadplusRoom(this.requestClient, this.grpcGatewayEmmiter)
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
  public on (event: 'message', listener: ((this: PadplusManager, data: PadplusMessagePayload) => void)): this
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

    if (this.options.memory) {
      const slot = await this.options.memory.get(String(this.options.name))
      log.silly(`==P==A==D==P==L==U==S==<test slot>==P==A==D==P==L==U==S==`)
      log.silly(PRE, `slot : ${util.inspect(slot)}`)
      const uin = slot.uin
      if (uin) {
        this.grpcGatewayEmmiter.setUIN(uin)
        await new Promise(r => setTimeout(r, 500))
        await this.padplusUser.initInstance(uin)
      } else {
        await this.padplusUser.getWeChatQRCode()
      }
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
            // log.silly(PRE, `LOGIN_QRCODE : ${util.inspect(qrcodeRawData)}`)
            const qrcodeData = JSON.parse(qrcodeRawData)
            this.grpcGatewayEmmiter.setQrcodeId(qrcodeData.qrcodeId)

            const fileBox = await FileBox.fromBase64(qrcodeData.qrcode, `qrcode${(Math.random() * 10000).toFixed()}.png`)
            await fileBox.toFile()
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
            QRCODE_SCAN MSG : ${scanData.msg || '已确认'}
            =================================================
            `)
            this.grpcGatewayEmmiter.setQrcodeId(scanData.user_name)
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

            if (this.options.memory) {
              this.memorySlot = {
                userName: loginData.userName,
                uin: loginData.uin,
                qrcodeId: '',
              }
              log.silly(PRE, `memory slot : ${util.inspect(this.memorySlot)}`)
              await this.options.memory.set(MEMORY_SLOT_NAME, this.memorySlot)
              await this.options.memory.save()
            }
            this.emit('login', loginData)
          }
          break
        case ResponseType.AUTO_LOGIN :
          const grpcAutoLoginData = data.getData()
          if (grpcAutoLoginData) {
            const autoLoginData = JSON.parse(grpcAutoLoginData)

            log.verbose(PRE, `init cache manager`)
            log.silly(PRE, `user name : ${util.inspect(autoLoginData)}`)
            await CacheManager.init(autoLoginData.wechatUser.userName)
            this.cacheManager = CacheManager.Instance

            this.emit('login', autoLoginData.wechatUser)
          }
          break
        case ResponseType.ACCOUNT_LOGOUT :
          const logoutRawData = data.getData()
          if (logoutRawData) {
            // TODO: parse logout data
            const logoutData = JSON.parse(logoutRawData)
            this.emit('logout', logoutData)
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
          const roomRawData = data.getData()
          if (roomRawData) {
            const _data = JSON.parse(roomRawData)
            if (!_data.ExtInfo) {
              const contactData: GrpcContactPayload = _data
              const contact = convertFromGrpcContact(contactData)
              if (this.cacheManager) {
                await this.cacheManager.setContact(contact.userName, contact)
              }
            } else {
              const roomData: GrpcRoomPayload = _data
              const roomPayload: PadplusRoomPayload = convertRoomFromGrpc(roomData)
              if (this.cacheManager) {
                await this.cacheManager.setRoom(roomPayload.chatroomId, roomPayload)
              } else {
                throw new PadplusError(PadplusErrorType.NO_CACHE, `CONTACT_MODIFY`)
              }
            }
          }
          break
        case ResponseType.CONTACT_DELETE :
          // TODO: delete contact in cache
          break
        case ResponseType.MESSAGE_RECEIVE :
          const rawMessageStr = data.getData()
          if (rawMessageStr) {
            const rawMessage: GrpcMessagePayload = JSON.parse(rawMessageStr)
            const message: PadplusMessagePayload = await this.onProcessMessage(rawMessage)
            this.emit('message', message)
          }
          break
        case ResponseType.ROOM_MEMBER_LIST :
          // TODO: not support now
          break
        case ResponseType.ROOM_MEMBER_MODIFY :
          // TODO: not support now
          break
        case ResponseType.STATUS_NOTIFY :
          // TODO: not support now
          break
        case ResponseType.REQUEST_RESPONSE :
          const requestId = data.getRequestid()
          const responseData = data.getData()
          if (responseData) {
            const callback = await CallbackPool.Instance.getCallback(requestId!)
            callback && callback(data)
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

  public async sendMessage (selfId: string, receiver: string, text: string, type: PadplusMessageType, mention?: string) {
    log.silly(PRE, ` : ${selfId}, : ${receiver}, : ${text}, : ${type}`)
    if (mention) {
      await this.padplusMesasge.sendMessage(selfId, receiver, text, type, mention)
    } else {
      await this.padplusMesasge.sendMessage(selfId, receiver, text, type)
    }
  }

  public async sendContact (selfId: string, receiver: string, contactId: string) {
    log.silly(PRE, `selfId : ${selfId},receiver : ${receiver},contactId : ${contactId}`)
    if (!this.cacheManager) {
      throw new PadplusError(PadplusErrorType.NO_CACHE, `sendContact()`)
    }
    let contact = await this.getContact(contactId)
    if (contact) {
      const content = {
        headImgUrl: contact.smallHeadUrl,
        userName: contact.userName,
        nickName: contact.nickName,
      }
      const contentStr = JSON.stringify(content)
      await this.padplusMesasge.sendContact(selfId, receiver, contentStr)
    } else {
      throw new Error('not able to send contact')
    }
  }

  private async getContact (contactId: string, count = 0): Promise<PadplusContactPayload | null | undefined> {
    if (!this.cacheManager) {
      throw new Error()
    }
    const contact = await this.cacheManager.getContact(contactId)
    if (contact) {
      return contact;
    }
    if (count === 0) {
      await this.padplusContact.getContactInfo(contactId)
    }

    if (count > 4) {
      return null
    }

    await new Promise(r => setTimeout(r, 400))
    return this.getContact(contactId, count + 1)
  }

  public async generatorFileUrl (file: FileBox): Promise<string> {
    log.verbose(PRE, 'generatorFileUrl(%s)', file)
    const url = await this.requestClient.uploadFile(file.name, await file.toStream())
    return url
  }

  public async sendFile (selfId: string, receiverId: string, url: string, fileName: string, subType: string) {
    log.verbose(PRE, 'sendFile()')

    await this.padplusMesasge.sendFile(selfId, receiverId, url, fileName, subType)

  }

  public async sendUrlLink (selfId: string, receiver: string, urlLinkPayload: UrlLinkPayload) {
    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload = {
      des: description,
      thumburl: thumbnailUrl,
      title,
      url,
      type: 5,
    }
    const content = JSON.stringify(payload)

    await this.padplusMesasge.sendUrlLink(selfId, receiver, content)
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
    if (!this.cacheManager) {
      throw new PadplusError(PadplusErrorType.NO_CACHE, 'contactList()')
    }

    return this.cacheManager.getContactIds()
  }

  public async getContactPayload (
    contactId: string,
  ): Promise<PadplusContactPayload> {
    if (!this.cacheManager) {
      throw new PadplusError(PadplusErrorType.NO_CACHE, 'getContactPayload')
    }
    let contact = await this.cacheManager.getContact(contactId)

    if (!contact) {
      throw new Error(`can not get contact info from cache manager`)
      // TODO: get contact info by GRPC
    }
    return contact
  }

  public async syncContacts (): Promise<void> {
    await this.padplusContact.syncContacts(this.grpcGatewayEmmiter.getUIN())
  }

  /**
   * 
   * room
   * 
   */

  public async setRoomTopic (
    selfId: string,
    roomId: string,
    topic: string,
  ) {
    await this.padplusRoom.setTopic(selfId, roomId, topic)
  }

  public async getRoomIdList ():Promise<string[]> {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    return await this.cacheManager.getRoomIds()
  }

  public async getRoomMemberIdList (
    roomId: string,
  ) {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    const memberMap = await this.cacheManager.getRoomMember(roomId)
    if (!memberMap) {
      return []
    }
    return Object.keys(memberMap)
  }

  public async getRoomInfo (
    roomId: string,
  ):Promise<PadplusRoomPayload> {
    log.verbose(PRE, `getRoomInfo()`)
    if (!this.cacheManager) {
      throw new Error(`no cache`)
    }
    const hasRoom = await this.cacheManager.hasRoom(roomId)
    if (hasRoom) {
      const room = await this.cacheManager.getRoom(roomId)
      return room!
    }
    throw new Error(`has no room for roomId:${roomId}`)
  }

  public async getRoomMembers (
    roomId: string,
  ) {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    const memberMap = await this.cacheManager.getRoomMember(roomId)
    return memberMap
  }

  public async setAnnouncement (
    roomId: string,
    announcement: string,
  ) {
    const uin = this.grpcGatewayEmmiter.getUIN()
    await this.padplusRoom.setAnnouncement(uin, roomId, announcement)
  }
  
   /**
    * 
    * messages
    * 
    */
}


export default PadplusManager
