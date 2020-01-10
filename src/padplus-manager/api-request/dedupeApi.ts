import { DelayQueueExecutor } from 'rx-queue'
import { log } from '../../config'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'

// Expire time for api call data that persist in the pool
// Number of seconds
const EXPIRE_TIME = 10

const DEDUPE_API = [
  ApiType.GET_CONTACT,
  ApiType.GET_ROOM_MEMBER,
]

interface ApiCall {
  timestamp: number,
  returned: boolean,
  result?: any,
  listener: PendingApiCall[],
}

interface PendingApiCall {
  resolve: (data: any) => void,
  reject: (e: any) => void,
}

const PRE = 'DedupeApi'

/**
 * This class will dedupe api calls
 * Multiple calls within a period of time will only fire up one api call to the server,
 * all the other calls will get the same response as the fired one
 *
 * Only api calls in the DEDUPE_API list will be affected.
 */
export class DedupeApi {

  private pool: {
    [key: string]: ApiCall
  }

  private cleaner: NodeJS.Timer

  private apiQueue: DelayQueueExecutor

  constructor () {
    this.pool = {}
    this.cleaner = setInterval(this.cleanData, EXPIRE_TIME * 1000)
    this.apiQueue = new DelayQueueExecutor(200)
  }

  public async dedupe (
    func: (apiName: ApiType, uin: string, params?: any) => Promise<any>,
    apiName: ApiType,
    uin: string,
    params?: any,
    forceCall?: boolean,
  ): Promise<any> {
    if (DEDUPE_API.indexOf(apiName) === -1) {
      log.silly(PRE, `dedupe() no need to dedupe api ${apiName}.`)
      return func(apiName, uin, params)
    }
    log.silly(PRE, `dedupeApi(${apiName}, ${uin}, ${params ? JSON.stringify(params) : ''})`)
    const key = this.getKey(apiName, uin, params)
    if (forceCall) {
      delete this.pool[key]
    }
    const existCall = this.pool[key]
    const now = new Date().getTime()
    if (existCall && now - existCall.timestamp < EXPIRE_TIME * 1000) {
      if (existCall.returned) {
        log.silly(PRE, `dedupeApi(${apiName}) dedupe api call with existing results.`)
        return existCall.result
      } else {
        log.silly(PRE, `dedupeApi(${apiName}) dedupe api call with pending listener.`)
        return new Promise((resolve, reject) => {
          existCall.listener.push({
            reject,
            resolve,
          })
        })
      }
    } else {
      log.silly(PRE, `dedupeApi(${apiName}) dedupe api call missed, call the external service.`)
      this.pool[key] = {
        listener: [],
        returned: false,
        timestamp: now,
      }
      let result: any
      try {
        result = await this.apiQueue.execute(() => func(apiName, uin, params))
      } catch (e) {
        log.silly(PRE, `dedupeApi(${apiName}) failed from external service, reject ${this.pool[key].listener.length} duplicate api calls.`)
        this.pool[key].listener.map(api => {
          api.reject(e)
        })
        this.pool[key].listener = []
        throw e
      }

      this.pool[key].result = result
      this.pool[key].returned = true
      log.silly(PRE, `dedupeApi(${apiName}) got results from external service, resolve ${this.pool[key].listener.length} duplicate api calls.`)
      this.pool[key].listener.map(api => {
        api.resolve(result)
      })
      this.pool[key].listener = []

      return result
    }
  }

  public clean () {
    for (const key in this.pool) {
      if (this.pool.hasOwnProperty(key)) {
        this.pool[key].listener.forEach(api => api.reject('Clean up api calls.'))
        delete this.pool[key]
      }
    }
    clearInterval(this.cleaner)
  }

  /**
   * Get rid of data in pool that exists for more than EXPIRE_TIME
   */
  private cleanData () {
    const now = new Date().getTime()
    for (const key in this.pool) {
      if (this.pool.hasOwnProperty(key)) {
        const apiCache = this.pool[key]
        if (apiCache.timestamp - now > EXPIRE_TIME * 1000) {
          delete this.pool[key]
        }
      }
    }
  }

  private getKey (apiName: ApiType, uin: string, params?: any) {
    return `${apiName}-${uin}-${params ? JSON.stringify(params) : ''}`
  }

}
