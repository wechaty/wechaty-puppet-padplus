import fs     from 'fs-extra'
import os     from 'os'
import path   from 'path'

import { WechatyCache,
  AsyncMap,
  WechatyCacheMessagePayload,
  WechatyCacheContactPayload,
  WechatyCacheRoomMemberPayload,
  WechatyCacheRoomPayload,
  WechatyCacheRoomInvitationPayload,
  WechatyCacheFriendshipPayload,
  WechatyCacheRoomMemberPayloadMap,
} from 'wechaty-cache'

import { log } from '../config'
import {
  PadplusContactPayload,
  PadplusRoomPayload,
  PadplusRoomInvitationPayload,
  PadplusRoomMemberMap,
  PadplusMessagePayload,
} from '../schemas'
import { FriendshipPayload } from 'wechaty-puppet'
import { cacheToPadplusMessagePayload,
  padplusToCacheMessagePayload,
  padplusToCacheContactPayload,
  cacheToPadplusContactPayload,
  cacheToPadplusRoomPayload,
  padplusToCacheRoomPayload,
  cacheToPadplusRoomMemberPayload,
  padplusToCacheRoomMemberPayload,
  cacheToPadplusRoomInvitationPayload,
  padplusToCacheRoomInvitationPayload,
  cacheToPadplusFriendshipPayload,
  padplusToCacheFriendshipPayload,
} from '../pure-function-helpers'

const PRE = 'CacheManager'

interface FlashStoreOption {
  type: 'flashStore',
  baseDir: string,
}
interface MongoStoreOption {
  type: 'mongo',
  url: string,
  option?: any,
}
export type CacheStoreOption = FlashStoreOption | MongoStoreOption

export class CacheManager {

  /**
   * ************************************************************************
   *                Static Methods
   * ************************************************************************
   */
  private static _instance?: CacheManager

  public static get Instance () {
    if (!this._instance) {
      throw new Error(`${PRE} cache manager instance not initialized.`)
    }
    return this._instance
  }

  public static async init (
    userId: string,
    cacheOption?: CacheStoreOption,
  ) {
    log.verbose(PRE, `init()`)
    if (this._instance) {
      log.verbose(PRE, `init() CacheManager has been initialized, no need to initialize again.`)
      return
    }
    this._instance = new CacheManager()
    await this._instance.initCache(userId, cacheOption)
  }

  public static async release () {
    log.verbose(PRE, `release()`)
    if (!this._instance) {
      log.verbose(PRE, `release() CacheManager not exist, no need to release it.`)
      return
    }
    await this._instance.releaseCache()
    this._instance = undefined
  }

  /**
   * ************************************************************************
   *                Instance Methods
   * ************************************************************************
   */
  private cacheImageMessageRawPayload?           : AsyncMap<string, WechatyCacheMessagePayload>
  private cacheContactRawPayload?                : AsyncMap<string, WechatyCacheContactPayload>
  private cacheRoomMemberRawPayload?             : AsyncMap<string, {
    [contactId: string]: WechatyCacheRoomMemberPayload,
  }>
  private cacheRoomRawPayload?                   : AsyncMap<string, WechatyCacheRoomPayload>
  private cacheRoomInvitationRawPayload?         : AsyncMap<string, WechatyCacheRoomInvitationPayload>
  private cacheFriendshipRawPayload?             : AsyncMap<string, WechatyCacheFriendshipPayload>

  private compactCacheTimer?                     : NodeJS.Timeout

  /**
   * -------------------------------
   * Message Section
   * --------------------------------
   */
  public async getMessage (
    messageId: string,
  ): Promise<PadplusMessagePayload | undefined> {
    if (!this.cacheImageMessageRawPayload) {
      throw new Error(`${PRE} getMessage() has no cache.`)
    }
    const cacheData = await this.cacheImageMessageRawPayload.get(messageId)
    return cacheData ? cacheToPadplusMessagePayload(cacheData) : undefined
  }

  public async setMessage (
    contactId: string,
    payload: PadplusMessagePayload
  ): Promise<void> {
    if (!this.cacheImageMessageRawPayload || !contactId) {
      throw new Error(`${PRE} setMessage() has no cache.`)
    }
    const cacheData = padplusToCacheMessagePayload(payload)
    await this.cacheImageMessageRawPayload.set(contactId, cacheData)
  }

  /**
   * -------------------------------
   * Contact Section
   * --------------------------------
   */
  public async getContact (
    contactId: string,
  ): Promise<PadplusContactPayload | undefined> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} getContact() has no cache.`)
    }
    const cacheData = await this.cacheContactRawPayload.get(contactId)
    return cacheData ? cacheToPadplusContactPayload(cacheData) : undefined
  }

  public async setContact (
    contactId: string,
    payload: PadplusContactPayload
  ): Promise<void> {
    if (!this.cacheContactRawPayload || !contactId) {
      throw new Error(`${PRE} setContact() has no cache.`)
    }
    const cacheData = padplusToCacheContactPayload(payload)
    await this.cacheContactRawPayload.set(contactId, cacheData)
  }

  public async deleteContact (
    contactId: string,
  ): Promise<void> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} deleteContact() has no cache.`)
    }
    await this.cacheContactRawPayload.delete(contactId)
  }

  public async getContactIds (): Promise<string[]> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} getContactIds() has no cache.`)
    }
    const result: string[] = []
    for await (const key of this.cacheContactRawPayload.keys()) {
      result.push(key)
    }

    return result
  }

  public async getAllContacts (): Promise<PadplusContactPayload[]> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} getAllContacts() has no cache.`)
    }
    const result: PadplusContactPayload[] = []
    for await (const value of this.cacheContactRawPayload.values()) {
      result.push(cacheToPadplusContactPayload(value))
    }
    return result
  }

  public async hasContact (contactId: string): Promise<boolean> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} hasContact() has no cache.`)
    }
    return this.cacheContactRawPayload.has(contactId)
  }

  public async getContactCount (): Promise<number> {
    if (!this.cacheContactRawPayload) {
      throw new Error(`${PRE} getContactCount() has no cache.`)
    }
    return this.cacheContactRawPayload.size
  }

  /**
   * -------------------------------
   * Room Section
   * --------------------------------
   */
  public async getRoom (
    roomId: string,
  ): Promise<PadplusRoomPayload | undefined> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} getRoom() has no cache.`)
    }
    const cacheData = await this.cacheRoomRawPayload.get(roomId)
    return cacheData ? cacheToPadplusRoomPayload(cacheData) : undefined
  }

  public async setRoom (
    roomId: string,
    payload: PadplusRoomPayload
  ): Promise<void> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} setRoom() has no cache.`)
    }
    const cacheData = padplusToCacheRoomPayload(payload)
    await this.cacheRoomRawPayload.set(roomId, cacheData)
  }

  public async deleteRoom (
    roomId: string,
  ): Promise<void> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} setRoom() has no cache.`)
    }
    await this.cacheRoomRawPayload.delete(roomId)
  }

  public async getRoomIds (): Promise<string[]> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} getRoomIds() has no cache.`)
    }
    const result: string[] = []
    for await (const key of this.cacheRoomRawPayload.keys()) {
      result.push(key)
    }
    return result
  }

  public async getRoomCount (): Promise<number> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} getRoomCount() has no cache.`)
    }
    return this.cacheRoomRawPayload.size
  }

  public async hasRoom (roomId: string): Promise<boolean> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} hasRoom() has no cache.`)
    }
    return this.cacheRoomRawPayload.has(roomId)
  }
  /**
   * -------------------------------
   * Room Member Section
   * --------------------------------
   */
  public async getRoomMember (
    roomId: string,
  ): Promise<PadplusRoomMemberMap | undefined> {
    if (!this.cacheRoomMemberRawPayload) {
      throw new Error(`${PRE} getRoomMember() has no cache.`)
    }
    const cacheData = await this.cacheRoomMemberRawPayload.get(roomId)
    if (!cacheData) {
      return undefined
    }
    const map: PadplusRoomMemberMap = {}
    for (const property of Object.keys(cacheData)) {
      map[property] = cacheToPadplusRoomMemberPayload(cacheData[property])
    }
    return map
  }

  public async setRoomMember (
    roomId: string,
    payload: PadplusRoomMemberMap,
  ): Promise<void> {
    if (!this.cacheRoomMemberRawPayload) {
      throw new Error(`${PRE} setRoomMember() has no cache.`)
    }
    const map: WechatyCacheRoomMemberPayloadMap = {}
    for (const property of Object.keys(payload)) {
      map[property] = padplusToCacheRoomMemberPayload(payload[property])
    }
    await this.cacheRoomMemberRawPayload.set(roomId, map)
  }

  public async deleteRoomMember (
    roomId: string,
  ): Promise<void> {
    if (!this.cacheRoomMemberRawPayload) {
      throw new Error(`${PRE} deleteRoomMember() has no cache.`)
    }
    await this.cacheRoomMemberRawPayload.delete(roomId)
  }

  /**
   * -------------------------------
   * Room Invitation Section
   * -------------------------------
   */
  public async getRoomInvitation (
    messageId: string,
  ): Promise<PadplusRoomInvitationPayload | undefined> {
    if (!this.cacheRoomInvitationRawPayload) {
      throw new Error(`${PRE} getRoomInvitationRawPayload() has no cache.`)
    }
    const cacheData = await this.cacheRoomInvitationRawPayload.get(messageId)
    return cacheData ? cacheToPadplusRoomInvitationPayload(cacheData) : undefined
  }

  public async setRoomInvitation (
    messageId: string,
    payload: PadplusRoomInvitationPayload,
  ): Promise<void> {
    if (!this.cacheRoomInvitationRawPayload) {
      throw new Error(`${PRE} setRoomInvitationRawPayload() has no cache.`)
    }
    const cacheData = padplusToCacheRoomInvitationPayload(payload)
    await this.cacheRoomInvitationRawPayload.set(messageId, cacheData)
  }

  public async deleteRoomInvitation (
    messageId: string,
  ): Promise<void> {
    if (!this.cacheRoomInvitationRawPayload) {
      throw new Error(`${PRE} deleteRoomInvitation() has no cache.`)
    }
    await this.cacheRoomInvitationRawPayload.delete(messageId)
  }

  /**
   * -------------------------------
   * Friendship Cache Section
   * --------------------------------
   */
  public async getFriendshipRawPayload (id: string) {
    if (!this.cacheFriendshipRawPayload) {
      throw new Error(`${PRE} getFriendshipRawPayload() has no cache.`)
    }
    const cacheData = await this.cacheFriendshipRawPayload.get(id)
    return cacheData ? cacheToPadplusFriendshipPayload(cacheData) : undefined
  }

  public async setFriendshipRawPayload (
    id: string,
    payload: FriendshipPayload,
  ) {
    if (!this.cacheFriendshipRawPayload) {
      throw new Error(`${PRE} setFriendshipRawPayload() has no cache.`)
    }
    const cacheData = padplusToCacheFriendshipPayload(payload)
    await this.cacheFriendshipRawPayload.set(id, cacheData)
  }

  /**
   * -------------------------------
   * Private Method Section
   * --------------------------------
   */

  private async initCache (
    userId: string,
    cacheOption: CacheStoreOption = {
      baseDir: process.cwd(),
      type: 'flashStore',
    },
  ): Promise<void> {
    log.verbose(PRE, 'initCache(%s,%s)', userId, JSON.stringify(cacheOption))

    if (this.cacheContactRawPayload) {
      throw new Error('cache exists')
    }

    const baseDir = path.join(
      os.homedir(),
      path.sep,
      '.wechaty',
      'puppet-padplus-cache',
      path.sep,
      'flash-store-v0.14',
      path.sep,
    )

    if (cacheOption.type === 'flashStore') {
      const baseDirExist = await fs.pathExists(baseDir)
      if (!baseDirExist) {
        await fs.mkdirp(baseDir)
      }
      cacheOption.baseDir = baseDir
    }
    const jsonCache = new WechatyCache({
      name: userId,
      storeOptions: cacheOption,
    })
    await jsonCache.init()
    this.cacheImageMessageRawPayload   = jsonCache.genMessageClient()
    this.cacheContactRawPayload        = jsonCache.genContactClient()
    this.cacheRoomMemberRawPayload     = jsonCache.genRoomMemberClient()
    this.cacheRoomRawPayload           = jsonCache.genRoomClient()
    this.cacheFriendshipRawPayload     = jsonCache.genFriendshipClient()
    this.cacheRoomInvitationRawPayload = jsonCache.genRoomInvitationClient()
    const contactTotal = this.cacheContactRawPayload.size

    log.verbose(PRE, `initCache() inited ${contactTotal} Contacts,  cachedir="${baseDir}"`)
  }

  private async releaseCache () {
    log.verbose(PRE, 'releaseCache()')

    if (this.cacheContactRawPayload
        && this.cacheRoomMemberRawPayload
        && this.cacheRoomRawPayload
        && this.cacheFriendshipRawPayload
        && this.cacheRoomInvitationRawPayload
        && this.cacheImageMessageRawPayload
    ) {
      log.silly(PRE, 'releaseCache() closing caches ...')

      if (this.compactCacheTimer) {
        clearTimeout(this.compactCacheTimer)
        this.compactCacheTimer = undefined
      }

      await Promise.all([
        this.cacheContactRawPayload.close(),
        this.cacheRoomMemberRawPayload.close(),
        this.cacheRoomRawPayload.close(),
        this.cacheFriendshipRawPayload.close(),
        this.cacheRoomInvitationRawPayload.close(),
        this.cacheImageMessageRawPayload.close(),
      ])

      this.cacheContactRawPayload    = undefined
      this.cacheRoomMemberRawPayload = undefined
      this.cacheRoomRawPayload       = undefined
      this.cacheFriendshipRawPayload = undefined
      this.cacheRoomInvitationRawPayload = undefined
      this.cacheImageMessageRawPayload = undefined

      log.silly(PRE, 'releaseCache() cache closed.')
    } else {
      log.verbose(PRE, 'releaseCache() cache not exist.')
    }
  }

}
