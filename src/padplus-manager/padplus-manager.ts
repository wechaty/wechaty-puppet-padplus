import util from 'util'
import {
  DelayQueueExecutor, ThrottleQueue,
}                             from 'rx-queue'
import { StateSwitch }        from 'state-switch'
import { log, GRPC_ENDPOINT, MESSAGE_CACHE_MAX, MESSAGE_CACHE_AGE, WAIT_FOR_READY_TIME } from '../config'
import { MemoryCard } from 'memory-card'
import FileBox from 'file-box'
import LRU from 'lru-cache'
import fileBoxToQrcode from '../utils/file-box-to-qrcode'

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
  PadplusRoomMemberPayload,
  GrpcSearchContact,
  GrpcDeleteContact,
  GrpcLogout,
} from '../schemas'
import { convertMessageFromGrpcToPadplus } from '../convert-manager/message-convertor'
import { GrpcMessagePayload, GrpcQrCodeLogin } from '../schemas/grpc-schemas'
import { CacheManager } from '../server-manager/cache-manager'
import { convertFromGrpcContact } from '../convert-manager/contact-convertor'
import { PadplusRoom } from './api-request/room'
import { convertRoomFromGrpc } from '../convert-manager/room-convertor'
import { CallbackPool } from '../utils/callbackHelper'
import { PadplusFriendship } from './api-request/friendship'
import { briefRoomMemberParser, roomMemberParser } from '../pure-function-helpers/room-member-parser'
import { isRoomId, isStrangerV1, isContactId } from '../pure-function-helpers'
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

export type PadplusManagerEvent = 'error' | 'scan' | 'login' | 'logout' | 'contact-list' | 'contact-modify' | 'contact-delete' | 'message' | 'room-member-list' | 'room-member-modify' | 'status-notify' | 'ready' | 'reset'

export class PadplusManager extends EventEmitter {

  private grpcGatewayEmitter?: GrpcEventEmitter
  // private grpcGateway        : GrpcGateway
  private readonly state     : StateSwitch
  private syncQueueExecutor  : DelayQueueExecutor
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
  private contactAndRoomData? : {
    contactTotal: number,
    friendTotal: number,
    roomTotal: number,
    updatedTime: number,
    readyEmitted: boolean,
  }
  private resetThrottleQueue    : ThrottleQueue

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
    this.loginStatus = false
    this.cachePadplusMessagePayload = new LRU<string, PadplusMessagePayload>(lruOptions)

    this.state = new StateSwitch('PadplusManager')
    this.state.off()

    this.memorySlot = {
      qrcodeId: '',
      uin: '',
      userName: '',
    }

    this.syncQueueExecutor = new DelayQueueExecutor(1000)

    this.resetThrottleQueue = new ThrottleQueue<string>(5000)
    this.resetThrottleQueue.subscribe(async reason => {
      log.silly('Puppet', 'constructor() resetThrottleQueue.subscribe() reason: %s', reason)

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
    log.silly(PRE, ` : ${util.inspect(this.state)}, ${this.syncQueueExecutor}`)
  }

  public emit (event: 'scan', qrcode: string, status: number, data?: string): boolean
  public emit (event: 'login', data: GrpcQrCodeLogin): boolean
  public emit (event: 'logout'): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: 'contact-modify', data: string): boolean
  public emit (event: 'contact-delete', data: string): boolean
  public emit (event: 'message', msg: PadplusMessagePayload): boolean
  public emit (event: 'room-member-list', data: string): boolean
  public emit (event: 'room-member-modify', data: string): boolean
  public emit (event: 'status-notify', data: string): boolean
  public emit (event: 'ready'): boolean
  public emit (event: 'reset', reason: string): boolean
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
  public on (event: 'logout', listener: ((this: PadplusManager) => void)): this
  public on (event: 'message', listener: ((this: PadplusManager, msg: PadplusMessagePayload) => void)): this
  public on (event: 'status-notify', listener: ((this: PadplusManager, data: string) => void)): this
  public on (event: 'ready', listener: ((this: PadplusManager) => void)): this
  public on (event: 'reset', listener: ((this: PadplusManager, reason: string) => void)): this
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
      log.info(`start grpc gateway failed for reason: ${e}, retry start in 5 seconds.`)
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

    await this.setContactAndRoomData()
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
    log.info(PRE, `stop()`)
    this.state.off('pending')

    if (this.grpcGatewayEmitter) {
      this.grpcGatewayEmitter.removeAllListeners()
    }

    await GrpcGateway.release()
    await CacheManager.release()
    this.cacheManager = undefined
    this.loginStatus = false

    this.state.off(true)
    log.info(PRE, `stop() finished`)
  }

  public async logout (): Promise<void> {
    log.info(PRE, `logout()`)
    this.state.off('pending')

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
    log.info(PRE, `logout() finished`)
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
      isStrangerV1(contact.stranger)
    }).length
    const now = new Date().getTime()
    if (this.contactAndRoomData) {

      if (this.contactAndRoomData.contactTotal === contactTotal
       && this.contactAndRoomData.roomTotal    === roomTotal
       && this.contactAndRoomData.friendTotal  === friendTotal) {
        if (now - this.contactAndRoomData.updatedTime > WAIT_FOR_READY_TIME
          && !this.contactAndRoomData.readyEmitted) {
          log.info(PRE, `setContactAndRoomData() more than ${WAIT_FOR_READY_TIME / 1000 / 60} minutes no change on data, emit ready event.`)
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

    grpcGatewayEmitter.on('grpc-error', async () => {
      this.resetThrottleQueue.next('reconnect')
    })

    grpcGatewayEmitter.on('grpc-end', async () => {
      this.emit('reset', 'grpc server end.')
    })

    grpcGatewayEmitter.on('data', async (data: StreamResponse) => {
      const type = data.getResponsetype()
      switch (type) {

        case ResponseType.LOGIN_QRCODE :
          const qrcodeRawData = data.getData()
          if (qrcodeRawData) {
            const qrcodeData = JSON.parse(qrcodeRawData)
            grpcGatewayEmitter.setQrcodeId(qrcodeData.qrcodeId)

            const fileBox = await FileBox.fromBase64(qrcodeData.qrcode, `qrcode${(Math.random() * 10000).toFixed()}.png`)
            const qrcodeUrl = await fileBoxToQrcode(fileBox)
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
              alias: '',
              bigHeadUrl: loginData.headImgUrl,
              city: '',
              contactFlag: 3,
              contactType: 0,
              country: '',
              labelLists: '',
              nickName: loginData.nickName,
              province: '',
              remark: '',
              sex: ContactGender.Unknown,
              signature: '',
              smallHeadUrl: '',
              stranger: '',
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

                const contactSelf: PadplusContactPayload = {
                  alias: '',
                  bigHeadUrl: wechatUser.headImgUrl,
                  city: '',
                  contactFlag: 3,
                  contactType: 0,
                  country: '',
                  labelLists: '',
                  nickName: wechatUser.nickName,
                  province: '',
                  remark: '',
                  sex: ContactGender.Unknown,
                  signature: '',
                  smallHeadUrl: '',
                  stranger: '',
                  ticket: '',
                  userName: wechatUser.userName,
                  verifyFlag: 0,
                }
                await this.cacheManager.setContact(contactSelf.userName, contactSelf)

                this.emit('login', wechatUser)
                this.loginStatus = true
              }
            } else {
              const uin = await grpcGatewayEmitter.getUIN()
              const wxid = await grpcGatewayEmitter.getUserName()
              const data = {
                uin,
                wxid,
              }
              await grpcGatewayEmitter.setUIN('')
              await grpcGatewayEmitter.setUserName('')
              if (this.padplusUser) {
                await this.padplusUser.getWeChatQRCode(data)
              }
            }
          }
          break

        case ResponseType.ACCOUNT_LOGOUT :
          const logoutRawData = data.getData()
          if (logoutRawData) {
            const logoutData: GrpcLogout = JSON.parse(logoutRawData)
            const uin = logoutData.uin
            const _uin = grpcGatewayEmitter.getUIN()
            if (uin === _uin) {
              this.loginStatus = false
              if (logoutData.mqType === 1100) {
                this.emit('error', new PadplusError(PadplusErrorType.EXIT, logoutData.message))
                this.emit('logout')
              }
            } else {
              const userName = grpcGatewayEmitter.getUserName()
              throw new Error(`can not get userName for this uin : ${uin}, userName: ${userName}`)
            }
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
                await this.cacheManager.deleteRoomMember(deleteUserName)
                await this.cacheManager.deleteRoom(deleteUserName)
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
          const contactStr = data.getData()
          if (contactStr) {
            const contact: GrpcSearchContact = JSON.parse(contactStr)
            const searchContactCallback = CallbackPool.Instance.getCallback(contact.wxid)
            searchContactCallback && searchContactCallback(data)
            CallbackPool.Instance.removeCallback(contact.wxid)
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
                if (!contact || contact.stranger !== '3') {
                  const newContact: PadplusContactPayload = {
                    alias: '',
                    bigHeadUrl: member.HeadImgUrl,
                    city: '',
                    contactFlag: 0,
                    contactType: 0,
                    country: '',
                    labelLists: '',
                    nickName: member.NickName,
                    province: '',
                    remark: member.DisplayName,
                    sex: ContactGender.Unknown,
                    signature: '',
                    smallHeadUrl: member.HeadImgUrl,
                    stranger: '',
                    ticket: '',
                    userName: member.UserName,
                    verifyFlag: 0,
                  }
                  await this.cacheManager.setContact(newContact.userName, newContact)
                } else {
                  const newContact: PadplusContactPayload = {
                    alias: contact.alias,
                    bigHeadUrl: member.HeadImgUrl,
                    city: contact.city,
                    contactFlag: 0,
                    contactType: 0,
                    country: contact.country,
                    labelLists: contact.labelLists,
                    nickName: member.NickName,
                    province: contact.province,
                    remark: member.DisplayName,
                    sex: ContactGender.Unknown,
                    signature: contact.signature,
                    smallHeadUrl: member.HeadImgUrl,
                    stranger: contact.stranger,
                    ticket: contact.ticket,
                    userName: member.UserName,
                    verifyFlag: 0,
                  }
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
          const mediaDataStr = data.getData()
          if (mediaDataStr) {
            const mediaData = JSON.parse(mediaDataStr)
            const callback = await CallbackPool.Instance.getCallback(mediaData.msgId)
            callback && callback(data)
            CallbackPool.Instance.removeCallback(mediaData.msgId)
          }
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
    return this.padplusMesasge.sendMessage(selfId, receiver, text, type, mention)
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
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    await this.padplusContact.getContactInfo(contactId)

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
  ): Promise<GrpcSearchContact> {
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    const payload = await this.padplusContact.searchContact(contactId)
    if (!payload) {
      throw new Error('Can not find payload for contactId ' + contactId)
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

  public async getRoomIdList ():Promise<string[]> {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    return this.cacheManager.getRoomIds()
  }

  public async getRoomMemberIdList (
    roomId: string,
  ) {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    let memberMap = await this.cacheManager.getRoomMember(roomId)
    if (!memberMap) {
      const room = await this.getRoomInfo(roomId)
      await Promise.all(
        room.members.map(m => {
          const _member: PadplusRoomMemberPayload = {
            bigHeadUrl: '',
            contactId: m.UserName,
            displayName: '',
            inviterId: '',
            nickName: m.NickName || '',
            smallHeadUrl: '',
          }
          if (!memberMap) {
            memberMap = {}
          }
          memberMap[m.UserName] = _member
        })
      )
    }
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
    if (!this.padplusContact) {
      throw new Error(`no padplusContact`)
    }
    await this.padplusContact.getContactInfo(roomId)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('get room timeout')), 5000)
      CallbackPool.Instance.pushContactCallback(roomId, (data) => {
        clearTimeout(timeout)
        resolve(data as PadplusRoomPayload)
      })
    })
    // return null
  }

  public async getRoomMembers (
    roomId: string,
  ) {
    if (!this.cacheManager) {
      throw new Error(`no cache.`)
    }
    const memberMap = await this.cacheManager.getRoomMember(roomId)
    if (!memberMap) {
      if (!this.grpcGatewayEmitter) {
        throw new Error(`no grpcGatewayEmitter.`)
      }
      const uin = this.grpcGatewayEmitter.getUIN()
      if (!this.padplusRoom) {
        throw new Error(`no padplus Room.`)
      }
      await this.padplusRoom.getRoomMembers(uin, roomId)

      const memberMap = await new Promise<{ [contactId: string]: PadplusRoomMemberPayload }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('get room member failed since timeout'))
        }, 5000)
        CallbackPool.Instance.pushRoomMemberCallback(roomId, (data: { [contactId: string]: PadplusRoomMemberPayload }) => {
          clearTimeout(timeout)
          resolve(data)
        })
      })
      return memberMap
    }
    return memberMap
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
    await this.padplusRoom.setAnnouncement(roomId, announcement)
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
    log.silly(PRE, `roomAddMember : ${util.inspect(roomId)};${memberId}`)
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
  ) {
    if (!this.padplusFriendship) {
      throw new Error(`no padplusFriendship`)
    }
    await this.padplusFriendship.confirmFriendship(encryptUserName, ticket)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('accept friend request timeout.'))
      }, 5000)
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

}
export default PadplusManager
