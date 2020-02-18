import fs     from 'fs-extra'
import os     from 'os'
import path   from 'path'

import { FlashStore } from 'flash-store'

import { log, COMPACT_CACHE_FIRST_START, COMPACT_CACHE_INTERVAL } from '../config'
import {
  PadplusContactPayload,
  PadplusRoomPayload,
  PadplusRoomInvitationPayload,
  PadplusRoomMemberPayload,
  PadplusRoomMemberMap,
} from '../schemas'
import { FriendshipPayload } from 'wechaty-puppet'

const PRE = 'CacheManager'

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

  public static async init (userId: string) {
    log.verbose(PRE, `init()`)
    if (this._instance) {
      log.verbose(PRE, `init() CacheManager has been initialized, no need to initialize again.`)
      return
    }
    this._instance = new CacheManager()
    await this._instance.initCache(userId)
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
  private cacheWXID?    : FlashStore<string, string>
  private cacheContactRawPayload?    : FlashStore<string, PadplusContactPayload>
  private cacheRoomMemberRawPayload? : FlashStore<string, {
    [contactId: string]: PadplusRoomMemberPayload,
  }>
  private cacheRoomRawPayload?       : FlashStore<string, PadplusRoomPayload>
  private cacheRoomInvitationRawPayload? : FlashStore<string, PadplusRoomInvitationPayload>
  private cacheFriendshipRawPayload? : FlashStore<string, FriendshipPayload>

  private compactCacheTimer?: NodeJS.Timeout

  /**
   * -------------------------------
   * Account-WXID Section
   * --------------------------------
   */
  public async getAccountWXID (
    account: string,
  ): Promise<string | undefined> {
    if (!this.cacheWXID) {
      throw new Error(`${PRE} getWXID() has no cache.`)
    }
    return this.cacheWXID.get(account)
  }

  public async setAccountWXID (
    account: string,
    wxid: string,
  ): Promise<void> {
    if (!this.cacheWXID) {
      throw new Error(`${PRE} setWXID() has no cache.`)
    }
    await this.cacheWXID.set(account, wxid)
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
    return this.cacheContactRawPayload.get(contactId)
  }

  public async setContact (
    contactId: string,
    payload: PadplusContactPayload
  ): Promise<void> {
    if (!this.cacheContactRawPayload || !contactId) {
      throw new Error(`${PRE} setContact() has no cache.`)
    }
    await this.cacheContactRawPayload.set(contactId, payload)
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
      result.push(value)
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
    return this.cacheRoomRawPayload.get(roomId)
  }

  public async setRoom (
    roomId: string,
    payload: PadplusRoomPayload
  ): Promise<void> {
    if (!this.cacheRoomRawPayload) {
      throw new Error(`${PRE} setRoom() has no cache.`)
    }
    await this.cacheRoomRawPayload.set(roomId, payload)
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
    return this.cacheRoomMemberRawPayload.get(roomId)
  }

  public async setRoomMember (
    roomId: string,
    payload: PadplusRoomMemberMap,
  ): Promise<void> {
    if (!this.cacheRoomMemberRawPayload) {
      throw new Error(`${PRE} setRoomMember() has no cache.`)
    }
    await this.cacheRoomMemberRawPayload.set(roomId, payload)
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
    return this.cacheRoomInvitationRawPayload.get(messageId)
  }

  public async setRoomInvitation (
    messageId: string,
    payload: PadplusRoomInvitationPayload,
  ): Promise<void> {
    if (!this.cacheRoomInvitationRawPayload) {
      throw new Error(`${PRE} setRoomInvitationRawPayload() has no cache.`)
    }
    await this.cacheRoomInvitationRawPayload.set(messageId, payload)
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
    return this.cacheFriendshipRawPayload.get(id)
  }

  public async setFriendshipRawPayload (
    id: string,
    payload: FriendshipPayload,
  ) {
    if (!this.cacheFriendshipRawPayload) {
      throw new Error(`${PRE} setFriendshipRawPayload() has no cache.`)
    }
    await this.cacheFriendshipRawPayload.set(id, payload)
  }

  /**
   * -------------------------------
   * Private Method Section
   * --------------------------------
   */

  private async initCache (
    userId: string,
  ): Promise<void> {
    log.verbose(PRE, 'initCache(%s)', userId)

    if (this.cacheContactRawPayload) {
      throw new Error('cache exists')
    }

    const baseDir = path.join(
      os.homedir(),
      path.sep,
      '.wechaty',
      'puppet-padplus-cache',
      path.sep,
      'flash-store-v0.18',
      path.sep,
      userId,
    )

    const baseDirExist = await fs.pathExists(baseDir)

    if (!baseDirExist) {
      await fs.mkdirp(baseDir)
    }

    this.cacheWXID                     = new FlashStore(path.join(baseDir, 'accound-wxid'))
    this.cacheContactRawPayload        = new FlashStore(path.join(baseDir, 'contact-raw-payload'))
    this.cacheRoomMemberRawPayload     = new FlashStore(path.join(baseDir, 'room-member-raw-payload'))
    this.cacheRoomRawPayload           = new FlashStore(path.join(baseDir, 'room-raw-payload'))
    this.cacheFriendshipRawPayload     = new FlashStore(path.join(baseDir, 'friendship'))
    this.cacheRoomInvitationRawPayload = new FlashStore(path.join(baseDir, 'room-invitation-raw-payload'))
    const contactTotal = this.cacheContactRawPayload.size

    this.compactCache().catch(e => log.error(`compactCache failed for reason:\n${e.stack}`))

    log.verbose(PRE, `initCache() inited ${contactTotal} Contacts,  cachedir="${baseDir}"`)
  }

  private async releaseCache () {
    log.verbose(PRE, 'releaseCache()')

    if (this.cacheContactRawPayload
        && this.cacheRoomMemberRawPayload
        && this.cacheRoomRawPayload
        && this.cacheFriendshipRawPayload
        && this.cacheRoomInvitationRawPayload
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
      ])

      this.cacheContactRawPayload    = undefined
      this.cacheRoomMemberRawPayload = undefined
      this.cacheRoomRawPayload       = undefined
      this.cacheFriendshipRawPayload = undefined
      this.cacheRoomInvitationRawPayload = undefined

      log.silly(PRE, 'releaseCache() cache closed.')
    } else {
      log.verbose(PRE, 'releaseCache() cache not exist.')
    }
  }

  private async compactCache (inited?: boolean) {
    if (inited) {
      this.compactCacheTimer = setTimeout(
        this.compactCache.bind(this),
        COMPACT_CACHE_FIRST_START,
      )
    } else {
      if (this.cacheContactRawPayload
        && this.cacheRoomMemberRawPayload
        && this.cacheRoomRawPayload
        && this.cacheFriendshipRawPayload
        && this.cacheRoomInvitationRawPayload
      ) {
        await this.compactDB(this.cacheContactRawPayload, 'contact-raw-payload')
        await this.compactDB(this.cacheRoomMemberRawPayload, 'room-member-raw-payload')
        await this.compactDB(this.cacheRoomRawPayload, 'room-raw-payload')
        await this.compactDB(this.cacheFriendshipRawPayload, 'friendship-raw-payload')
        await this.compactDB(this.cacheRoomInvitationRawPayload, 'room-invitation-payload')
      }

      log.verbose(`Compact all dbs finished.`)
      this.compactCacheTimer = setTimeout(
        this.compactCache.bind(this),
        COMPACT_CACHE_INTERVAL,
      )
    }
  }

  private async compactDB (flashStore: FlashStore, storeName: string) {
    try {
      await flashStore.size
    } catch (e) {
      log.warn(`Failed to to flash-store check before compact for ${storeName} DB.`)
      return
    }
    const db = (flashStore as any).levelDb.db.db.db
    await new Promise((resolve) => {
      db.compact((err: any) => {
        if (err) {
          log.warn(`Compact ${storeName} DB failed, error stack:\n${err.stack}`)
        } else {
          log.verbose(`Compact ${storeName} DB success.`)
        }
        resolve()
      })
    })
  }

}
