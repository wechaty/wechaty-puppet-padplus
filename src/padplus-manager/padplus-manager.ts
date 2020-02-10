import util from 'util'
import {
  DelayQueueExecutor, ThrottleQueue,
}                             from 'rx-queue'
import { StateSwitch }        from 'state-switch'
import { log, GRPC_ENDPOINT, MESSAGE_CACHE_MAX, MESSAGE_CACHE_AGE, WAIT_FOR_READY_TIME, INVALID_TOKEN_MESSAGE, EXPIRED_TOKEN_MESSAGE } from '../config'
import { MemoryCard } from 'memory-card'
import FileBox from 'file-box'
import LRU from 'lru-cache'

import { GrpcGateway } from '../server-manager/grpc-gateway'
import { StreamResponse, ResponseType } from '../server-manager/proto-ts/PadPlusServer_pb'
import { ScanStatus, ContactGender, FriendshipPayload as PuppetFriendshipPayload } from 'wechaty-puppet'
import { RequestClient } from './api-request/request'
import { PadplusUser } from './api-request/user'
import { PadplusContact } from './api-request/contact'
import { PadplusMessage } from './api-request/message'
import { GrpcEventEmitter } from '../server-manager/grpc-event-emitter'
import {
  GrpcContactPayload,
  GrpcRoomPayload,
  PadplusContactPayload,
  PadplusError,
  PadplusErrorType,
  PadplusMessagePayload,
  PadplusMessageType,
  PadplusRoomPayload,
  ScanData,
  FriendshipPayload,
  QrcodeStatus,
  PadplusRichMediaData,
  GrpcRoomMemberPayload,
  GrpcRoomMemberList,
  PadplusMediaData,
  GrpcSearchContact,
  GrpcDeleteContact,
  LogoutGrpcResponse,
  PadplusRoomMemberMap,
  TagGrpcPayload,
  GrpcMessagePayload,
  GrpcQrCodeLogin,
  GetContactSelfInfoGrpcResponse,
  TagPayload,
  PadplusRoomInviteEvent,
} from '../schemas'
import { convertMessageFromGrpcToPadplus } from '../convert-manager/message-convertor'
import { CacheManager } from '../server-manager/cache-manager'
import { convertFromGrpcContact, convertFromGrpcContactSelf } from '../convert-manager/contact-convertor'
import { PadplusRoom } from './api-request/room'
import { convertRoomFromGrpc } from '../convert-manager/room-convertor'
import { CallbackPool } from '../utils/callbackHelper'
import { PadplusFriendship } from './api-request/friendship'
import { briefRoomMemberParser, roomMemberParser } from '../pure-function-helpers/room-member-parser'
import { isRoomId, isContactId } from '../pure-function-helpers'
import { EventEmitter } from 'events'

const MEMORY_SLOT_NAME = 'WECHATY_PUPPET_PADPLUS'

export interface PadplusMemorySlot {
  qrcodeId: string,
  uin : string,
  userName  : string,
}

export interface ManagerOptions {
  token: string,
  name: unknown,
  endpoint?: string,
}

const PRE = 'PadplusManager'

export type PadplusManagerEvent = 'error' | 'scan' | 'login' | 'logout' | 'contact-list' | 'contact-modify' | 'contact-delete' | 'message' | 'room-member-list' | 'room-member-modify' | 'status-notify' | 'ready' | 'reset' | 'heartbeat' | 'EXPIRED_TOKEN' | 'INVALID_TOKEN'

export class PadplusManager extends EventEmitter {

  private grpcGatewayEmitter?: GrpcEventEmitter
  private readonly state     : StateSwitch
  private requestClient?     : RequestClient
  private padplusUser?       : PadplusUser
  private padplusMesasge?    : PadplusMessage
  private padplusContact?    : PadplusContact
  private padplusRoom?       : PadplusRoom
  private padplusFriendship? : PadplusFriendship
  public cacheManager?      : CacheManager
  private memory?            : MemoryCard
  private memorySlot         : PadplusMemorySlot
  private qrcodeStatus?      : ScanStatus
  private loginStatus?       : boolean
  public readonly cachePadplusMessagePayload: LRU<string, PadplusMessagePayload>
  public readonly cachePadplusSearchContactPayload: LRU<string, GrpcSearchContact>
  private contactAndRoomData? : {
    contactTotal: number,
    friendTotal: number,
    roomTotal: number,
    updatedTime: number,
    readyEmitted: boolean,
  }
  private resetThrottleQueue    : ThrottleQueue
  private getContactQueue       : DelayQueueExecutor
  private getRoomMemberQueue    : DelayQueueExecutor
  constructor (
    public options: ManagerOptions,
  ) {
    super()
    log.verbose(PRE, 'constructor()')
    const lruOptions: LRU.Options<string, PadplusMessagePayload> = {
      dispose (key: string, val: any) {
        log.silly(PRE, `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      },
      max: MESSAGE_CACHE_MAX,
      maxAge: MESSAGE_CACHE_AGE,
    }
    this.cachePadplusMessagePayload = new LRU<string, PadplusMessagePayload>(lruOptions)
    const searchContactlruOptions: LRU.Options<string, GrpcSearchContact> = {
      dispose (key: string, val: any) {
        log.silly(PRE, `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      },
      max: MESSAGE_CACHE_MAX,
      maxAge: MESSAGE_CACHE_AGE,
    }
    this.cachePadplusSearchContactPayload = new LRU<string, GrpcSearchContact>(searchContactlruOptions)

    this.loginStatus = false

    this.state = new StateSwitch('PadplusManager')
    this.state.off()

    this.memorySlot = {
      qrcodeId: '',
      uin: '',
      userName: '',
    }

    this.getContactQueue = new DelayQueueExecutor(200)
    this.getRoomMemberQueue = new DelayQueueExecutor(500)
    this.resetThrottleQueue = new ThrottleQueue<string>(5000)
    this.resetThrottleQueue.subscribe(async reason => {
      log.silly(PRE, 'constructor() resetThrottleQueue.subscribe() reason: %s', reason)

      if (this.grpcGatewayEmitter) {
        this.grpcGatewayEmitter.removeAllListeners()
      }
      delete this.padplusUser
      delete this.padplusContact
      delete this.padplusFriendship
      delete this.padplusRoom
      delete this.padplusMesasge
      delete this.requestClient

      await this.start()
    })
    log.silly(PRE, ` : ${util.inspect(this.state)}`)
  }

  public emit (event: 'scan', qrcode: string, status: number, data?: string): boolean
  public emit (event: 'login', data: GrpcQrCodeLogin): boolean
  public emit (event: 'logout', reason?: string): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: 'contact-modify', data: string): boolean
  public emit (event: 'contact-delete', data: string): boolean
  public emit (event: 'message', msg: PadplusMessagePayload): boolean
  public emit (event: 'room-member-list', data: string): boolean
  public emit (event: 'room-member-modify', data: string): boolean
  public emit (event: 'status-notify', data: string): boolean
  public emit (event: 'ready'): boolean
  public emit (event: 'reset', reason: string): boolean
  public emit (event: 'heartbeat', data: string): boolean
  public emit (event: 'error', error: Error): boolean
  public emit (event: never, listener: never): never

  public emit (
    event: PadplusManagerEvent,
    ...args: any[]
  ): boolean {
    return super.emit(event, ...args)
  }

  public on (event: 'scan', listener: ((this: PadplusManager, qrcode: string, status: number, data?: string) => void)): this
  public on (event: 'login', listener: ((this: PadplusManager, data: GrpcQrCodeLogin) => void)): this
  public on (event: 'logout', listener: ((this: PadplusManager, reason?: string) => void)): this
  public on (event: 'message', listener: ((this: PadplusManager, msg: PadplusMessagePayload) => void)): this
  public on (event: 'status-notify', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'ready', listener: ((this: PadplusManager) => void)): this
  public on (event: 'reset', listener: ((this: PadplusManager, reason: string) => void)): this
  public on (event: 'heartbeat', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'error', listener: ((this: PadplusManager, error: Error) => void)): this
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
    log.silly(PRE, `start()`)

    this.state.on('pending')

    let emitter: GrpcEventEmitter | undefined
    try {
      emitter = await GrpcGateway.init(this.options.token, this.options.endpoint || GRPC_ENDPOINT, String(this.options.name))
    } catch (e) {
      log.info(PRE, `start grpc gateway failed for reason: ${e}, retry start in 5 seconds.`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      await this.start()
      return
    }
    if (!GrpcGateway.Instance) {
      throw new Error(`The grpc gateway has no instance.`)
    }
    this.requestClient = new RequestClient(GrpcGateway.Instance, emitter)
    this.padplusUser = new PadplusUser(this.requestClient)
    this.padplusMesasge = new PadplusMessage(this.requestClient)
    this.padplusContact = new PadplusContact(this.requestClient)
    this.padplusRoom = new PadplusRoom(this.requestClient)
    this.padplusFriendship = new PadplusFriendship(this.requestClient)

    await this.initGrpcGatewayListener(emitter)
    this.grpcGatewayEmitter = emitter

    if (this.memory) {
      const slot = await this.memory.get(MEMORY_SLOT_NAME)
      if (slot && slot.uin) {
        log.silly(PRE, `uin : ${slot.uin}`)
        emitter.setUIN(slot.uin)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await this.padplusUser.initInstance()
      } else {
        await this.padplusUser.getWeChatQRCode()
      }
      this.memorySlot = {
        ...this.memorySlot,
        ...await this.memory.get<PadplusMemorySlot>(MEMORY_SLOT_NAME),
      }
    }

  }

  public async stop (): Promise<void> {
    log.verbose(PRE, `stop()`)
    this.state.off('pending')

    if (this.grpcGatewayEmitter) {
      this.grpcGatewayEmitter.removeAllListeners()
    }

    await GrpcGateway.release()
    await CacheManager.release()
    this.cacheManager = undefined
    this.loginStatus = false

    this.state.off(true)
    log.verbose(PRE, `stop() finished`)
  }

  public async logout (selfId: string): Promise<void> {
    log.verbose(PRE, `logout()`)
    this.state.off('pending')

    if (this.padplusUser) {
      const logoutResult: boolean = await this.padplusUser.logout(selfId)
      if (!logoutResult) {
        log.error(PRE, `Logout WeChat failed!`)
      } else {
        log.silly(PRE, `Logout WeChat success!`)
      }
    } else {
      throw new Error(`no padplus user.`)
    }

    if (this.grpcGatewayEmitter) {
      this.grpcGatewayEmitter.removeAllListeners()
    }

    if (GrpcGateway.Instance) {
      await GrpcGateway.Instance.stop()
    }
    await CacheManager.release()
    this.cacheManager = undefined
    this.loginStatus = false

    this.state.off(true)
    log.verbose(PRE, `logout() finished`)
  }

  public setMemory (memory: MemoryCard) {
    this.memory = memory
  }

  public async setContactAndRoomData () {
    log.silly(PRE, `setContactAndRoomData()`)
    if (!this.cacheManager) {
      log.verbose(PRE, `setContactAndRoomData() can not proceed due to no cache.`)
      return
    }
    const contactTotal = await this.cacheManager.getContactCount()
    const roomTotal = await this.cacheManager.getRoomCount()
    const friendTotal = (await this.cacheManager.getAllContacts()).filter(contact => {
      return contact.contactFlag !== 0
    }).length
    const now = new Date().getTime()
    if (this.contactAndRoomData) {

      if (this.contactAndRoomData.contactTotal === contactTotal
       && this.contactAndRoomData.roomTotal    === roomTotal
       && this.contactAndRoomData.friendTotal  === friendTotal) {
        if (now - this.contactAndRoomData.updatedTime > WAIT_FOR_READY_TIME
          && !this.contactAndRoomData.readyEmitted) {
          log.verbose(PRE, `setContactAndRoomData() more than ${WAIT_FOR_READY_TIME / 1000 / 60} minutes no change on data, emit ready event.`)
          this.contactAndRoomData.readyEmitted = true
          this.emit('ready')
        }
        log.silly(PRE, `setContactAndRoomData() found contact, room, friend data no change.`)
      } else {
        log.silly(PRE, `setContactAndRoomData() found contact or room or friend change. Record changes...`)
        this.contactAndRoomData.contactTotal = contactTotal
        this.contactAndRoomData.roomTotal    = roomTotal
        this.contactAndRoomData.friendTotal  = friendTotal
        this.contactAndRoomData.updatedTime  = now
      }
    } else {
      log.silly(PRE, `setContactAndRoomData() initialize contact and room data.`)
      this.contactAndRoomData = {
        contactTotal,
        friendTotal,
        readyEmitted: false,
        roomTotal,
        updatedTime: now,
      }
    }
  }

  public async initGrpcGatewayListener (grpcGatewayEmitter: GrpcEventEmitter) {

    grpcGatewayEmitter.on('reconnect', async () => {
      this.resetThrottleQueue.next('reconnect')
    })

    grpcGatewayEmitter.on('grpc-end', async () => {
      this.emit('reset', 'grpc server end.')
    })

    grpcGatewayEmitter.on('heartbeat', async (data: any) => {
      this.emit('heartbeat', data)
      // TODO: 数据同步后，需要停止该函数的执行
      if (!this.contactAndRoomData || !this.contactAndRoomData.readyEmitted) {
        await this.setContactAndRoomData()
      }
    })

    grpcGatewayEmitter.on('EXPIRED_TOKEN', async () => {
      log.info(PRE, EXPIRED_TOKEN_MESSAGE)
      setTimeout(() => process.exit(), 5000)
    })

    grpcGatewayEmitter.on('INVALID_TOKEN', async () => {
      log.info(PRE, INVALID_TOKEN_MESSAGE)
      setTimeout(() => process.exit(), 5000)
    })

    grpcGatewayEmitter.on('data', async (data: StreamResponse) => {
      const type = data.getResponsetype()
      switch (type) {

        case ResponseType.LOGIN_QRCODE :
          const qrcodeRawData = data.getData()
          if (qrcodeRawData) {
            const qrcodeData = JSON.parse(qrcodeRawData)
            grpcGatewayEmitter.setQrcodeId(qrcodeData.qrcodeId)

            const fileBox = FileBox.fromBase64(qrcodeData.qrcode, `qrcode${(Math.random() * 10000).toFixed()}.png`)
            const qrcodeUrl = await fileBox.toQRCode()
            this.emit('scan', qrcodeUrl, ScanStatus.Cancel)
            this.qrcodeStatus = ScanStatus.Cancel
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
            grpcGatewayEmitter.setQrcodeId(scanData.user_name)
            switch (scanData.status as QrcodeStatus) {
              case QrcodeStatus.Scanned:
                if (this.qrcodeStatus !== ScanStatus.Waiting) {
                  this.qrcodeStatus = ScanStatus.Waiting
                  this.emit('scan', '', this.qrcodeStatus)
                }
                break

              case QrcodeStatus.Confirmed:
                if (this.qrcodeStatus !== ScanStatus.Scanned) {
                  this.qrcodeStatus = ScanStatus.Scanned
                  this.emit('scan', '', this.qrcodeStatus)
                }
                break

              case QrcodeStatus.Canceled:
              case QrcodeStatus.Expired:
                const uin = await grpcGatewayEmitter.getUIN()
                const wxid = await grpcGatewayEmitter.getUserName()
                const data = {
                  uin,
                  wxid,
                }
                this.emit('scan', '', scanData.status)

                if (this.padplusUser) {
                  await this.padplusUser.getWeChatQRCode(data)
                }
                break

              default:
                break

            }
          }
          break

        case ResponseType.QRCODE_LOGIN :
          const grpcLoginData = data.getData()
          if (grpcLoginData) {
            log.silly(PRE, `QRCODE_LOGIN : ${util.inspect(grpcLoginData)}`)
            const loginData: GrpcQrCodeLogin = JSON.parse(grpcLoginData)

            this.loginStatus = true

            grpcGatewayEmitter.setQrcodeId('')
            grpcGatewayEmitter.setUserName(loginData.userName)
            grpcGatewayEmitter.setUIN(loginData.uin)

            if (this.memory) {
              this.memorySlot = {
                qrcodeId: '',
                uin: loginData.uin,
                userName: loginData.userName,
              }
              log.silly(PRE, `name: ${this.options.name}, memory slot : ${util.inspect(this.memorySlot)}`)
              await this.memory.set(MEMORY_SLOT_NAME, this.memorySlot)
              await this.memory.save()
            }

            log.verbose(PRE, `init cache manager`)
            await CacheManager.init(loginData.userName)
            this.cacheManager = CacheManager.Instance

            const contactSelf: PadplusContactPayload = {
              alias: loginData.alias,
              bigHeadUrl: loginData.headImgUrl,
              city: '',
              contactFlag: 3,
              contactType: 0,
              country: '',
              nickName: loginData.nickName,
              province: '',
              remark: '',
              sex: ContactGender.Unknown,
              signature: '',
              smallHeadUrl: '',
              stranger: '',
              tagList: '',
              ticket: '',
              userName: loginData.userName,
              verifyFlag: 0,
            }
            await this.cacheManager.setContact(contactSelf.userName, contactSelf)

            this.emit('login', loginData)

            const selfOnline = await this.getContact(loginData.userName)
            if (selfOnline) {
              await this.cacheManager.setContact(selfOnline.userName, selfOnline)
            }
          }
          break

        case ResponseType.AUTO_LOGIN :
          const grpcAutoLoginData = data.getData()
          if (grpcAutoLoginData) {
            const autoLoginData = JSON.parse(grpcAutoLoginData)
            log.silly(PRE, `user name : ${util.inspect(autoLoginData)}`)
            if (autoLoginData && autoLoginData.online) {
              if (!this.loginStatus) {
                const wechatUser = autoLoginData.wechatUser
                log.verbose(PRE, `init cache manager`)
                await CacheManager.init(wechatUser.userName)
                this.cacheManager = CacheManager.Instance
                /* if (this.padplusUser) {
                  await this.padplusUser.reconnect()
                } else {
                  throw new Error(`no padplus user.`)
                } */

                const contactSelf: PadplusContactPayload = {
                  alias: wechatUser.alias,
                  bigHeadUrl: wechatUser.headImgUrl,
                  city: '',
                  contactFlag: 3,
                  contactType: 0,
                  country: '',
                  nickName: wechatUser.nickName,
                  province: '',
                  remark: '',
                  sex: ContactGender.Unknown,
                  signature: '',
                  smallHeadUrl: '',
                  stranger: '',
                  tagList: '',
                  ticket: '',
                  userName: wechatUser.userName,
                  verifyFlag: 0,
                }
                await this.cacheManager.setContact(contactSelf.userName, contactSelf)

                this.emit('login', wechatUser)
                this.loginStatus = true

                return this.contactSelfInfo()
                  .then(async contactSelfInfo => {
                    if (contactSelfInfo) {
                      const contactSelfPayload = convertFromGrpcContactSelf(contactSelfInfo)
                      if (!this.cacheManager) {
                        throw new Error(`no cache manager`)
                      }
                      return this.cacheManager.setContact(contactSelfPayload.userName, contactSelfPayload)
                    } else {
                      throw new Error(`can not get contact self info.`)
                    }
                  })
              }
            } else {
              const uin = grpcGatewayEmitter.getUIN()
              const wxid = grpcGatewayEmitter.getUserName()
              let data: {uin: string, wxid: string}
              if (this.memory) {
                const slot = await this.memory!.get(MEMORY_SLOT_NAME)
                data = {
                  uin: slot.uin,
                  wxid: slot.userName,
                }
              } else {
                data = {
                  uin,
                  wxid,
                }
              }
              grpcGatewayEmitter.setUIN('')
              grpcGatewayEmitter.setUserName('')
              if (this.padplusUser) {
                await this.padplusUser.getWeChatQRCode(data)
              }
            }
          }
          break

        case ResponseType.ACCOUNT_LOGOUT :
          const logoutRawData = data.getData()
          if (logoutRawData) {
            const logoutData: LogoutGrpcResponse = JSON.parse(logoutRawData)
            const uin = data.getUin()
            const _uin = grpcGatewayEmitter.getUIN()
            if (uin === _uin) {
              this.loginStatus = false
              if (logoutData.mqType === 1100) {
                // TODO: should be removed in the future, only need to emit logout event here.
                this.emit('error', new PadplusError(PadplusErrorType.EXIT, logoutData.message))
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000))

                this.emit('logout', logoutData.message)
              }
            } else {
              const userName = grpcGatewayEmitter.getUserName()
              throw new Error(`can not get userName for this uin : ${uin}, userName: ${userName}`)
            }
          } else {
            log.info(PRE, `can not get data from Event LOGOUT, ready to restart...`)
            if (!this.padplusUser) {
              throw new Error(`no padplusUser`)
            }
            await this.padplusUser.reconnect()
            await new Promise((resolve) => setTimeout(resolve, 30 * 1000))
            this.emit('reset', 'logout with some unknow reasons')
          }
          break

        case ResponseType.CONTACT_LIST :
        case ResponseType.CONTACT_MODIFY :
          const roomRawData = data.getData()
          if (roomRawData) {
            const _data = JSON.parse(roomRawData)
            if (!isRoomId(_data.UserName)) {
              const contactData: GrpcContactPayload = _data

              const contact = convertFromGrpcContact(contactData, true)
              if (this.cacheManager) {
                await this.cacheManager.setContact(contact.userName, contact)
              }

              CallbackPool.Instance.resolveContactCallBack(contact.userName, contact)
            } else {
              const roomData: GrpcRoomPayload = _data
              const roomPayload: PadplusRoomPayload = convertRoomFromGrpc(roomData)
              if (this.cacheManager) {
                const roomMembers = briefRoomMemberParser(roomPayload.members)
                const _roomMembers = await this.cacheManager.getRoomMember(roomPayload.chatroomId)
                if (!_roomMembers) {
                  await this.cacheManager.setRoomMember(roomPayload.chatroomId, roomMembers)
                }
                await this.cacheManager.setRoom(roomPayload.chatroomId, roomPayload)
              } else {
                throw new PadplusError(PadplusErrorType.NO_CACHE, `CONTACT_MODIFY`)
              }
              CallbackPool.Instance.resolveRoomCallBack(roomPayload.chatroomId, roomPayload)
            }
          }
          break
        case ResponseType.CONTACT_DELETE :
          const contactDataStr = data.getData()
          if (contactDataStr) {
            const contactData: GrpcDeleteContact = JSON.parse(contactDataStr)
            log.silly(PRE, `delete contact data : ${util.inspect(contactData)}`)
            const deleteUserName = contactData.field
            if (this.cacheManager) {
              if (isRoomId(deleteUserName)) {
                // No need to clear this room cache when the bot been removed.
                // TODO: add a flag for the removed room
              } else if (isContactId(deleteUserName)) {
                await this.cacheManager.deleteContact(deleteUserName)
              } else {
                throw new Error(`the filed is not right.`)
              }
            }
          }
          break
        case ResponseType.MESSAGE_RECEIVE :
          const rawMessageStr = data.getData()
          if (rawMessageStr) {
            const rawMessage: GrpcMessagePayload = JSON.parse(rawMessageStr)
            const message: PadplusMessagePayload = await this.onProcessMessage(rawMessage)
            this.emit('message', message)
          }
          break
        case ResponseType.CONTACT_ADD :
          const addContactCallback = CallbackPool.Instance.getCallback(data.getRequestid()!)
          addContactCallback && addContactCallback(data)
          CallbackPool.Instance.removeCallback(data.getRequestid()!)
          break
        case ResponseType.CONTACT_SEARCH :
          const searchContactTraceId = data.getTraceid()
          if (searchContactTraceId) {
            const searchContactCallback = CallbackPool.Instance.getCallback(searchContactTraceId)
            searchContactCallback && searchContactCallback(data)
            CallbackPool.Instance.removeCallback(searchContactTraceId)
          }
          break
        case ResponseType.ROOM_QRCODE:
          const roomQrcodeTraceId = data.getTraceid()
          if (roomQrcodeTraceId) {
            const callback = CallbackPool.Instance.getCallback(roomQrcodeTraceId)
            callback && callback(data)
            CallbackPool.Instance.removeCallback(roomQrcodeTraceId)
          }
          break
        case ResponseType.ROOM_MEMBER_LIST :
          const roomMembersStr = data.getData()
          if (roomMembersStr) {
            if (this.cacheManager) {
              const roomMemberList: GrpcRoomMemberList = JSON.parse(roomMembersStr)
              const roomId = roomMemberList.roomId
              const membersStr = roomMemberList.membersJson
              const membersList: GrpcRoomMemberPayload[] = JSON.parse(membersStr)
              const members = roomMemberParser(membersList)
              await this.cacheManager.setRoomMember(roomId, members)

              await Promise.all(membersList.map(async member => {
                if (!this.cacheManager) {
                  throw new PadplusError(PadplusErrorType.NO_CACHE, 'roomMemberList')
                }
                const contact = await this.cacheManager.getContact(member.UserName)
                if (!contact) {
                  const newContact: PadplusContactPayload = {
                    alias: '',
                    bigHeadUrl: member.HeadImgUrl,
                    city: '',
                    contactFlag: 0,
                    contactType: 0,
                    country: '',
                    nickName: member.NickName,
                    province: '',
                    remark: '',
                    sex: ContactGender.Unknown,
                    signature: '',
                    smallHeadUrl: member.HeadImgUrl,
                    stranger: '',
                    tagList: '',
                    ticket: '',
                    userName: member.UserName,
                    verifyFlag: 0,
                  }
                  await this.cacheManager.setContact(newContact.userName, newContact)
                } else {
                  const newContact: PadplusContactPayload = Object.assign({}, contact, {
                    bigHeadUrl: member.HeadImgUrl,
                    nickName: member.NickName,
                    smallHeadUrl: member.HeadImgUrl,
                    userName: member.UserName,
                  })
                  await this.cacheManager.setContact(newContact.userName, newContact)
                }
                CallbackPool.Instance.resolveRoomMemberCallback(roomId, members)
              }))
            } else {
              throw new PadplusError(PadplusErrorType.NO_CACHE, `CONTACT_MODIFY`)
            }
          } else {
            throw new Error(`can not get receive room member data from server`)
          }
          break
        case ResponseType.ROOM_MEMBER_MODIFY :
          // TODO: not support now
          break
        case ResponseType.STATUS_NOTIFY :
          // TODO: not support now
          break
        case ResponseType.MESSAGE_MEDIA_SRC :
          const traceId = data.getTraceid()
          if (traceId) {
            const callback = CallbackPool.Instance.getCallback(traceId)
            callback && callback(data)
            CallbackPool.Instance.removeCallback(traceId)
          } else {
            log.silly(PRE, `can not get trace id`)
          }
          break
        case ResponseType.REQUEST_RESPONSE :
          const requestId = data.getRequestid()
          const responseData = data.getData()
          if (responseData) {
            const callback = CallbackPool.Instance.getCallback(requestId!)
            callback && callback(data)
          }
          break

      }
    })
  }

  /**
   * Contact Self Section
   */
  public async contactSelfQrcode (): Promise<string> {
    log.silly(PRE, `contactSelfQrcode()`)

    if (this.padplusContact) {
      return this.padplusContact.contactSelfQrcode()
    } else {
      throw new Error(`no padplus contact`)
    }
  }

  public async contactSelfName (name: string): Promise<void> {
    log.silly(PRE, `contactSelfName(${name})`)

    if (this.padplusContact) {
      const data = {
        nickName: name,
      }
      await this.padplusContact.setContactSelfInfo(data)
    } else {
      throw new Error(`no padplus contact`)
    }
  }

  public async contactSelfSignature (signature: string): Promise<void> {
    log.silly(PRE, `contactSelfSignature(${signature})`)

    if (this.padplusContact) {
      const data = {
        signature,
      }
      await this.padplusContact.setContactSelfInfo(data)
    } else {
      throw new Error(`no padplus contact`)
    }
  }

  public contactSelfInfo (): Promise<GetContactSelfInfoGrpcResponse> {
    log.silly(PRE, `contactSelfInfo()`)

    if (this.padplusContact) {
      return this.padplusContact.getContactSelfInfo()
    } else {
      throw new Error(`no padplus contact`)
    }
  }
  /**
   * Message Section
   */

  public async loadRichMediaData (mediaData: PadplusRichMediaData): Promise<PadplusMediaData> {
    log.silly(PRE, `loadRichMediaData()`)

    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    const data = await this.padplusMesasge.loadRichMeidaData(mediaData)
    const mediaStr = data.getData()
    if (mediaStr) {
      const mediaData = JSON.parse(mediaStr)
      return mediaData
    } else {
      throw new Error(`can not load media data on manager`)
    }
  }

  public async sendMessage (selfId: string, receiver: string, text: string, type: PadplusMessageType, mention?: string) {
    log.silly(PRE, `selfId : ${selfId}, receiver : ${receiver}, text : ${text}, type : ${type}`)
    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    const messageResponse = await this.padplusMesasge.sendMessage(selfId, receiver, text, type, mention)
    if (!messageResponse.msgId) {
      throw new Error(`This message send failed, because the response message id is : ${messageResponse.msgId}.`)
    }
    return messageResponse
  }

  public async sendVoice (selfId: string, receiver: string, url: string, fileSize: string) {
    log.silly(PRE, `selfId : ${selfId},receiver : ${receiver}`)
    if (!this.cacheManager) {
      throw new PadplusError(PadplusErrorType.NO_CACHE, `sendContact()`)
    }
    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    return this.padplusMesasge.sendVoice(selfId, receiver, url, fileSize)
  }

  public async sendContact (selfId: string, receiver: string, contentStr: string) {
    log.silly(PRE, `selfId : ${selfId},receiver : ${receiver}`)
    if (!this.cacheManager) {
      throw new PadplusError(PadplusErrorType.NO_CACHE, `sendContact()`)
    }
    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    return this.padplusMesasge.sendContact(selfId, receiver, contentStr)
  }

  public async addFriend (
    contactId: string,
    hello: string | undefined,
    isPhoneNumber: number,
    strangerV1: string,
    strangerV2: string,
  ) {
    log.verbose(PRE, `addFriend(), isPhoneNumber: ${isPhoneNumber}`)

    if (!this.padplusFriendship) {
      throw new Error(`no padplusFriendship`)
    }
    return this.padplusFriendship.addFriend(strangerV1, strangerV2, isPhoneNumber, contactId, hello)
  }

  public async generatorFileUrl (file: FileBox): Promise<string> {
    log.verbose(PRE, 'generatorFileUrl(%s)', file)
    if (this.requestClient) {
      const url = await this.requestClient.uploadFile(file.name, await file.toStream())
      return url
    } else {
      throw new Error(`no requestClient`)
    }
  }

  public async sendFile (selfId: string, receiverId: string, url: string, fileName: string, subType: string, fileSize?: number) {
    log.verbose(PRE, 'sendFile()')

    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    return this.padplusMesasge.sendFile(selfId, receiverId, url, fileName, subType, fileSize)

  }

  public async sendUrlLink (selfId: string, receiver: string, content: string) {

    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }
    return this.padplusMesasge.sendUrlLink(selfId, receiver, content)
  }

  private async onProcessMessage (rawMessage: any): Promise<PadplusMessagePayload> {
    const payload: PadplusMessagePayload = await convertMessageFromGrpcToPadplus(rawMessage)
    this.cachePadplusMessagePayload.set(payload.msgId, payload)
    return payload
  }

  /**
   * Contact Section
   */

  public async getOrCreateTag (tagName: string): Promise<string> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    return this.padplusContact.getOrCreateTag(tagName)
  }

  public async addTag (tagId: string, contactId: string): Promise<void> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    const tags = await this.tags(contactId)
    const tagsId = tags.map(tag => tag.id)
    const allTagsId = tagsId.length === 0 ? tagId : tagsId.join(',') + ',' + tagId
    await this.padplusContact.addTag(allTagsId, contactId)
  }

  public async removeTag (tagId: string, contactId: string): Promise<void> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    if (!this.cacheManager) {
      throw new Error(`no cacheManager`)
    }
    const contact = await this.cacheManager.getContact(contactId)
    if (contact && contact.tagList) {
      const array = contact.tagList.split(',')
      const index = array.indexOf(tagId)
      if (index !== -1) {
        array.splice(index, 1)
        await this.padplusContact.addTag(array.join(','), contactId)
      }
    }
  }

  public async tags (contactId?: string): Promise<TagPayload []> {
    if (!this.cacheManager) {
      throw new Error(`no cacheManager`)
    }

    const tagList: TagPayload[] = await this.tagList()

    if (!contactId) {
      return tagList
    }

    const contact = await this.cacheManager.getContact(contactId)
    if (!contact || !contact.tagList) {
      throw new Error(`can not get contact or tagList of contact by this contactId: ${contactId}`)
    }
    const contactTagIdList = contact.tagList

    const contactTagIdArray = contactTagIdList.split(',')

    const tags: TagPayload[] = []
    await Promise.all(contactTagIdArray.map((id: string) => {
      tagList.map(tag => {
        if (tag && id === tag.id.toString()) {
          tags.push(tag)
        }
      })
    }))

    return tags
  }

  public async tagList (): Promise<TagPayload []> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    const tagGrpcList: TagGrpcPayload[] = await this.padplusContact.tagList()

    if (tagGrpcList && tagGrpcList.length === 0) {
      return []
    }

    return tagGrpcList.map(t => {
      const tag: TagPayload = {
        id: t.LabelID,
        name: t.LabelName,
      }
      return tag
    })
  }

  public async modifyTag (tagId: string, name: string): Promise<void> {
    log.silly(PRE, `modifyTag(${tagId}, ${name})`)
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    await this.padplusContact.modifyTag(tagId, name)
  }

  public async deleteTag (tagId: string): Promise<void> {
    log.silly(PRE, `deleteTag(${tagId})`)
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    await this.padplusContact.deleteTag(tagId)
  }

  public async setContactAlias (
    contactId: string,
    alias: string,
  ): Promise<void> {
    log.silly(PRE, `setContactAlias(), contactId : ${contactId}, alias: ${alias}`)

    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    await this.padplusContact.setAlias(contactId, alias)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('set alias failed since timeout'))
      }, 5000)
      CallbackPool.Instance.pushContactAliasCallback(contactId, alias, () => {
        clearTimeout(timeout)
        resolve()
      })
    })
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

  public async getContact (
    contactId: string
  ): Promise<PadplusContactPayload | null | undefined> {
    if (!this.cacheManager) {
      throw new Error()
    }
    const contact = await this.cacheManager.getContact(contactId)
    if (contact) {
      return contact
    }

    await this.getContactQueue.execute(async () => {
      if (!this.padplusContact) {
        throw new Error(`no padplusContact`)
      }
      await this.padplusContact.getContactInfo(contactId)
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('get contact timeout')), 5000)
      CallbackPool.Instance.pushContactCallback(contactId, (data) => {
        clearTimeout(timeout)
        resolve(data as PadplusContactPayload)
      })
    })
  }

  public async getContactPayload (
    contactId: string,
  ): Promise<PadplusContactPayload> {
    const payload = await this.getContact(contactId)
    if (!payload) {
      throw new Error('Can not find payload for contactId ' + contactId)
    }
    return payload
  }

  public async searchContact (
    contactId: string,
    save?: boolean,
  ): Promise<GrpcSearchContact | null> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }

    let payload = this.cachePadplusSearchContactPayload.get(contactId)
    if (!payload) {
      log.silly(PRE, `No search-friend data in cache, need to request.`)
      payload = await this.padplusContact.searchContact(contactId)

      if (!payload || payload.status !== '0') {
        log.error(PRE, 'Can not find payload for contactId ' + contactId)
        return null
      } else if (save) {
        this.cachePadplusSearchContactPayload.set(contactId, payload)
      }
    }

    return payload
  }

  public async syncContacts (): Promise<void> {
    log.silly(PRE, `sync all contacts`)

    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    await this.padplusContact.syncContacts()
  }

  /**
   * Room Section
   */
  public async setRoomTopic (
    roomId: string,
    topic: string,
  ) {
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    await this.padplusRoom.setTopic(roomId, topic)
    if (this.cacheManager) {
      await this.cacheManager.deleteRoom(roomId)
    } else {
      throw new Error(`no cache manager.`)
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('set alias failed since timeout'))
      }, 5000)
      CallbackPool.Instance.pushRoomTopicCallback(roomId, topic, () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  public async getRoomQrcode (roomId: string): Promise<string> {
    if (!this.padplusRoom) {
      throw new Error(`no padplusRoom`)
    }
    const qrcodeBuf = await this.padplusRoom.getRoomQrcode(roomId)
    const fileBox = FileBox.fromBase64(qrcodeBuf, `${Date.now()}.png`)
    return fileBox.toQRCode()
  }

  public async getRoomIdList ():Promise<string[]> {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    return this.cacheManager.getRoomIds()
  }

  public async getRoomMemberIdList (
    roomId: string,
  ) {
    const memberMap = await this.getRoomMembers(roomId)

    if (memberMap) {
      return Object.keys(memberMap)
    } else {
      return []
    }
  }

  public async getRoomInfo (roomId: string) {
    const room = await this.getRoom(roomId)
    if (room) {
      if (!this.cacheManager) {
        throw new PadplusError(PadplusErrorType.NO_CACHE, `get room info`)
      }
      await this.cacheManager.setRoom(room.chatroomId, room)
      return room
    } else {
      throw new Error(`can not get room info by api`)
    }
  }

  public async getRoom (roomId: string): Promise<PadplusRoomPayload | null | undefined> {
    if (!this.cacheManager) {
      throw new Error()
    }
    const room = await this.cacheManager.getRoom(roomId)
    if (room) {
      return room
    }
    await this.getContactQueue.execute(async () => {
      if (!this.padplusContact) {
        throw new Error(`no padplusContact`)
      }
      await this.padplusContact.getContactInfo(roomId)
    })
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('get room timeout')), 5000)
      CallbackPool.Instance.pushContactCallback(roomId, (data) => {
        clearTimeout(timeout)
        resolve(data as PadplusRoomPayload)
      })
    })
  }

  public async getRoomMembers (
    roomId: string,
  ): Promise<PadplusRoomMemberMap> {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    const memberMap = await this.cacheManager.getRoomMember(roomId)
    if (!memberMap) {
      if (!this.grpcGatewayEmitter) {
        throw new Error(`no grpcGatewayEmitter.`)
      }
      const uin = this.grpcGatewayEmitter.getUIN()
      await this.getRoomMemberQueue.execute(async () => {
        if (!this.padplusRoom) {
          throw new Error(`no padplus Room.`)
        }
        await this.padplusRoom.getRoomMembers(uin, roomId)
      })
      return new Promise<PadplusRoomMemberMap>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('get room member failed since timeout'))
        }, 5000)
        CallbackPool.Instance.pushRoomMemberCallback(roomId, (data: PadplusRoomMemberMap) => {
          clearTimeout(timeout)
          resolve(data)
        })
      })
    } else {
      return memberMap
    }
  }

  public async deleteRoomMember (roomId: string, contactId: string): Promise<void> {
    log.silly(PRE, `deleteRoomMember(%s, %s)`, roomId, contactId)
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    await this.padplusRoom.deleteRoomMember(roomId, contactId)
  }

  public async setAnnouncement (
    roomId: string,
    announcement: string,
  ) {
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    return this.padplusRoom.setAnnouncement(roomId, announcement)
  }

  public async getAnnouncement (
    roomId: string,
  ): Promise<string> {
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    return this.padplusRoom.getAnnouncement(roomId)
  }

  public async roomAddMember (
    roomId: string,
    memberId: string,
  ) {
    log.silly(PRE, `roomAddMember: ${roomId}, ${memberId}`)
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    await this.padplusRoom.addMember(roomId, memberId)
  }

  public async createRoom (
    topic: string,
    memberIdList: string[],
  ) {
    log.silly(PRE, `careteRoom : ${topic}, ${memberIdList.join(',')}`)
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    const result = await this.padplusRoom.createRoom(topic, memberIdList)
    return result
  }

  public async quitRoom (
    roomId: string,
  ) {
    log.silly(PRE, `quitRoom : ${roomId}`)
    if (!this.padplusRoom) {
      throw new Error(`no padplus Room.`)
    }
    await this.padplusRoom.quitRoom(roomId)
  }

  public async saveRoomInvitationRawPayload (roomInvitation: PadplusRoomInviteEvent): Promise<void> {
    log.verbose(PRE, `saveRoomInvitationRawPayload(${JSON.stringify(roomInvitation)})`)
    const { msgId, roomName, url, fromUser, timestamp } = roomInvitation

    if (!this.cacheManager) {
      throw new Error(`${PRE} saveRoomInvitationRawPayload() has no cache.`)
    }
    await this.cacheManager.setRoomInvitation(msgId, {
      fromUser,
      id: msgId,
      roomName,
      timestamp,
      url,
    })
  }

  public async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.verbose(PRE, `roomInvitationAccept(${roomInvitationId})`)
    if (!this.cacheManager) {
      throw new Error(`no cache manager`)
    }

    const roomInvitationData = await this.cacheManager.getRoomInvitation(roomInvitationId)

    if (roomInvitationData) {
      if (!this.padplusRoom) {
        throw new Error(`no padplus room instance`)
      }
      await this.padplusRoom.getRoomInvitationDetail(roomInvitationData.url, roomInvitationData.fromUser)
    }
  }

  /**
   *
   * room event
   *
   */
  public async roomInvitationRawPayload (
    roomInvitationId: string,
  ) {
    log.verbose(PRE, `roomInvitationRawPayload(${roomInvitationId})`)
    if (!this.cacheManager) {
      throw new Error(`no cache manager.`)
    }
    const payload = await this.cacheManager.getRoomInvitation(roomInvitationId)
    if (payload) {
      return payload
    } else {
      throw new Error(`can not find invitation with id:${roomInvitationId}`)
    }
  }

  /**
   * Friendship Section
   */
  public async getFriendship (
    friendshipId: string,
  ) {
    log.silly(PRE, `getFriendship(${friendshipId})`)
    if (!this.cacheManager) {
      throw new Error(`no cache manager.`)
    }
    const friendship = await this.cacheManager.getFriendshipRawPayload(friendshipId)
    return friendship
  }

  public async confirmFriendship (
    contactId: string,
    encryptUserName: string,
    ticket: string,
    scene: string,
  ) {
    log.silly(PRE, `confirmFriendship(), contactId: ${contactId}, encryptUserName: ${encryptUserName}, ticket: ${ticket}, scene: ${scene}`)
    if (!this.padplusFriendship) {
      throw new Error(`no padplusFriendship`)
    }
    await this.padplusFriendship.confirmFriendship(encryptUserName, ticket, scene)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('accept friend request timeout.'))
      }, 60 * 1000)
      CallbackPool.Instance.pushAcceptFriendCallback(contactId, () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  public async saveFriendship (
    friendshipId: string,
    friendship: FriendshipPayload,
  ): Promise<void> {
    log.silly(PRE, `saveFriendship : ${util.inspect(friendship)}`)
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    await this.cacheManager.setFriendshipRawPayload(friendshipId, friendship as PuppetFriendshipPayload)
  }

  public async recallMessage (selfId: string, receiverId: string, messageId: string): Promise<boolean> {
    log.silly(PRE, `selfId : ${selfId}, receiver : ${receiverId}, messageId : ${messageId}`)
    if (!this.padplusMesasge) {
      throw new Error(`no padplus message`)
    }

    const isSuccess = await this.padplusMesasge.recallMessage(selfId, receiverId, messageId)
    return isSuccess
  }

}
export default PadplusManager
