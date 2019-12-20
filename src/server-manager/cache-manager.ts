import fs     from 'fs-extra'
import os     from 'os'
import path   from 'path'

import { FlashStore } from 'flash-store'

import { log } from '../config'
import {
  PadplusContactPayload,
  PadplusRoomPayload,
  PadplusRoomInvitationPayload,
  PadplusRoomMemberPayload,
  PadplusRoomMemberMap,
} from '../schemas'
import { FriendshipPayload } from 'wechaty-puppet'
import { MongoManager } from './mongo-manager'

const PRE = 'CacheManager'

export class CacheManager {

  /**
   * ************************************************************************
   *                Static Methods
   * ************************************************************************
   */
  private mongoCache?: boolean
  private mongoUrl?: string
  private static _instance?: CacheManager

  public static get Instance () {
    if (!this._instance) {
      throw new Error(`${PRE} cache manager instance not initialized.`)
    }
    return this._instance
  }

  public static async init (userId: string, mongoCache?: string) {
    log.verbose(PRE, `init()`)
    if (this._instance) {
      log.verbose(PRE, `init() CacheManager has been initialized, no need to initialize again.`)
      return
    }
    this._instance = new CacheManager()
    if (mongoCache) {
      this._instance.mongoCache = true
      this._instance.mongoUrl = mongoCache
    } else {
      this._instance.mongoCache = false
    }
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
  private cacheContactRawPayload?    : FlashStore<string, PadplusContactPayload>
  private cacheRoomMemberRawPayload? : FlashStore<string, {
    [contactId: string]: PadplusRoomMemberPayload,
  }>
  private cacheRoomRawPayload?       : FlashStore<string, PadplusRoomPayload>
  private cacheRoomInvitationRawPayload? : FlashStore<string, PadplusRoomInvitationPayload>
  private cacheFriendshipRawPayload? : FlashStore<string, FriendshipPayload>

  private mongoManager?              : MongoManager

  /**
   * -------------------------------
   * Contact Section
   * --------------------------------
   */
  public async getContact (
    contactId: string,
  ): Promise<PadplusContactPayload | undefined> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getContact(contactId)
    } else {
      if (!this.cacheContactRawPayload) {
        throw new Error(`${PRE} getContact() has no cache.`)
      }
      return this.cacheContactRawPayload.get(contactId)
    }
  }

  public async setContact (
    contactId: string,
    payload: PadplusContactPayload
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.setContact(payload)
    } else {
      if (!this.cacheContactRawPayload || !contactId) {
        throw new Error(`${PRE} setContact() has no cache.`)
      }
      await this.cacheContactRawPayload.set(contactId, payload)
    }
  }

  public async deleteContact (
    contactId: string,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.deleteContact(contactId)
    } else {
      if (!this.cacheContactRawPayload) {
        throw new Error(`${PRE} deleteContact() has no cache.`)
      }
      await this.cacheContactRawPayload.delete(contactId)
    }
  }

  public async getContactIds (): Promise<string[]> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getContactIds()
    } else {
      if (!this.cacheContactRawPayload) {
        throw new Error(`${PRE} getContactIds() has no cache.`)
      }
      const result: string[] = []
      for await (const key of this.cacheContactRawPayload.keys()) {
        result.push(key)
      }
      return result
    }
  }

  public async getAllContacts (): Promise<PadplusContactPayload[]> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getAllContacts()
    } else {
      if (!this.cacheContactRawPayload) {
        throw new Error(`${PRE} getAllContacts() has no cache.`)
      }
      const result: PadplusContactPayload[] = []
      for await (const value of this.cacheContactRawPayload.values()) {
        result.push(value)
      }
      return result
    }
  }

  public async getContactCount (): Promise<number> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getContactCount()
    } else {
      if (!this.cacheContactRawPayload) {
        throw new Error(`${PRE} getContactCount() has no cache.`)
      }
      return this.cacheContactRawPayload.size
    }
  }

  /**
   * -------------------------------
   * Room Section
   * --------------------------------
   */
  public async getRoom (
    roomId: string,
  ): Promise<PadplusRoomPayload | undefined> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getRoom(roomId)
    } else {
      if (!this.cacheRoomRawPayload) {
        throw new Error(`${PRE} getRoom() has no cache.`)
      }
      return this.cacheRoomRawPayload.get(roomId)
    }
  }

  public async setRoom (
    roomId: string,
    payload: PadplusRoomPayload
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.setRoom(payload)
    } else {
      if (!this.cacheRoomRawPayload) {
        throw new Error(`${PRE} setRoom() has no cache.`)
      }
      await this.cacheRoomRawPayload.set(roomId, payload)
    }
  }

  public async deleteRoom (
    roomId: string,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.deleteRoom(roomId)
    } else {
      if (!this.cacheRoomRawPayload) {
        throw new Error(`${PRE} setRoom() has no cache.`)
      }
      await this.cacheRoomRawPayload.delete(roomId)
    }
  }

  public async getRoomIds (): Promise<string[]> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getRoomIds()
    } else {
      if (!this.cacheRoomRawPayload) {
        throw new Error(`${PRE} getRoomIds() has no cache.`)
      }
      const result: string[] = []
      for await (const key of this.cacheRoomRawPayload.keys()) {
        result.push(key)
      }
      return result
    }
  }

  public async getRoomCount (): Promise<number> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getRoomCount()
    } else {
      if (!this.cacheRoomRawPayload) {
        throw new Error(`${PRE} getRoomCount() has no cache.`)
      }
      return this.cacheRoomRawPayload.size
    }
  }

  /**
   * -------------------------------
   * Room Member Section
   * --------------------------------
   */
  public async getRoomMember (
    roomId: string,
  ): Promise<PadplusRoomMemberMap | undefined> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getRoomMember(roomId)
    } else {
      if (!this.cacheRoomMemberRawPayload) {
        throw new Error(`${PRE} getRoomMember() has no cache.`)
      }
      return this.cacheRoomMemberRawPayload.get(roomId)
    }
  }

  public async setRoomMember (
    roomId: string,
    payload: PadplusRoomMemberMap,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.setRoomMember(roomId, payload)
    } else {
      if (!this.cacheRoomMemberRawPayload) {
        throw new Error(`${PRE} setRoomMember() has no cache.`)
      }
      await this.cacheRoomMemberRawPayload.set(roomId, payload)
    }
  }

  public async deleteRoomMember (
    roomId: string,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.deleteRoomMember(roomId)
    } else {
      if (!this.cacheRoomMemberRawPayload) {
        throw new Error(`${PRE} deleteRoomMember() has no cache.`)
      }
      await this.cacheRoomMemberRawPayload.delete(roomId)
    }
  }

  /**
   * -------------------------------
   * Room Invitation Section
   * -------------------------------
   */
  public async getRoomInvitation (
    messageId: string,
  ): Promise<PadplusRoomInvitationPayload | undefined> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getRoomInvitation(messageId)
    } else {
      if (!this.cacheRoomInvitationRawPayload) {
        throw new Error(`${PRE} getRoomInvitationRawPayload() has no cache.`)
      }
      return this.cacheRoomInvitationRawPayload.get(messageId)
    }
  }

  public async setRoomInvitation (
    messageId: string,
    payload: PadplusRoomInvitationPayload,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.setRoomInvitation(messageId, payload)
    } else {
      if (!this.cacheRoomInvitationRawPayload) {
        throw new Error(`${PRE} setRoomInvitationRawPayload() has no cache.`)
      }
      await this.cacheRoomInvitationRawPayload.set(messageId, payload)
    }
  }

  public async deleteRoomInvitation (
    messageId: string,
  ): Promise<void> {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.deleteRoomInvitation(messageId)
    } else {
      if (!this.cacheRoomInvitationRawPayload) {
        throw new Error(`${PRE} deleteRoomInvitation() has no cache.`)
      }
      await this.cacheRoomInvitationRawPayload.delete(messageId)
    }
  }

  /**
   * -------------------------------
   * Friendship Cache Section
   * --------------------------------
   */
  public async getFriendshipRawPayload (id: string) {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      return this.mongoManager.getFriendshipRawPayload(id)
    } else {
      if (!this.cacheFriendshipRawPayload) {
        throw new Error(`${PRE} getFriendshipRawPayload() has no cache.`)
      }
      return this.cacheFriendshipRawPayload.get(id)
    }
  }

  public async setFriendshipRawPayload (
    id: string,
    payload: FriendshipPayload,
  ) {
    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.setFriendshipRawPayload(payload)
    } else {
      if (!this.cacheFriendshipRawPayload) {
        throw new Error(`${PRE} setFriendshipRawPayload() has no cache.`)
      }
      await this.cacheFriendshipRawPayload.set(id, payload)
    }
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
    if (this.mongoCache) {
      this.mongoManager = new MongoManager(userId)
      await this.mongoManager.init(this.mongoUrl!)
      log.verbose(PRE, `initCache() mongo cache inited.`)
    } else {
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
        userId,
      )

      const baseDirExist = await fs.pathExists(baseDir)

      if (!baseDirExist) {
        await fs.mkdirp(baseDir)
      }

      this.cacheContactRawPayload        = new FlashStore(path.join(baseDir, 'contact-raw-payload'))
      this.cacheRoomMemberRawPayload     = new FlashStore(path.join(baseDir, 'room-member-raw-payload'))
      this.cacheRoomRawPayload           = new FlashStore(path.join(baseDir, 'room-raw-payload'))
      this.cacheFriendshipRawPayload     = new FlashStore(path.join(baseDir, 'friendship'))

      const contactTotal = this.cacheContactRawPayload.size

      log.verbose(PRE, `initCache() inited ${contactTotal} Contacts,  cachedir="${baseDir}"`)
    }
  }

  private async releaseCache () {
    log.verbose(PRE, 'releaseCache()')

    if (this.mongoCache) {
      if (!this.mongoManager) {
        throw new Error(`can not init mongo connection`)
      }
      await this.mongoManager.release()
    } else {
      if (this.cacheContactRawPayload
          && this.cacheRoomMemberRawPayload
          && this.cacheRoomRawPayload
          && this.cacheFriendshipRawPayload
      ) {
        log.silly(PRE, 'releaseCache() closing caches ...')

        await Promise.all([
          this.cacheContactRawPayload.close(),
          this.cacheRoomMemberRawPayload.close(),
          this.cacheRoomRawPayload.close(),
          this.cacheFriendshipRawPayload.close(),
        ])

        this.cacheContactRawPayload    = undefined
        this.cacheRoomMemberRawPayload = undefined
        this.cacheRoomRawPayload       = undefined
        this.cacheFriendshipRawPayload = undefined

        log.silly(PRE, 'releaseCache() cache closed.')
      } else {
        log.verbose(PRE, 'releaseCache() cache not exist.')
      }
    }
  }

}
