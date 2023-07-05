import { EventEmitter } from 'events'
import { log } from '../../config'
import { sleep } from '../../utils/util'

interface FunctionObj {
  func: () => any,
  resolve: (data: any) => void,
  reject: (e: any) => void,
  delayBefore?: number,
  delayAfter?: number,
  uniqueKey?: string,
}

export interface RateOptions {
  queueId?: string,
  delayBefore?: number,
  delayAfter?: number,
  uniqueKey?: string,
}

type RateManagerEvents = 'error'

const MAX_QUEUE_SIZE = 20000

export class RateManager extends EventEmitter {

  private counter = 0

  public emit (event: 'error', error: string): boolean
  public emit (event: never, ...args: never[]): never
  public emit (event: RateManagerEvents, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

  public on (event: 'error', listener: (error: string) => void): this
  public on (event: never, listener: never): never
  public on (event: RateManagerEvents, listener : (...args: any[]) => void): this {
    super.on(event, listener)
    return this
  }

  private functionQueueMap: { [id: string]: FunctionObj[] } = {}
  private runningMap: { [id: string]: boolean } = {}

  public getQueueLength (queueId: string) {
    if (!this.functionQueueMap[queueId]) {
      return 0
    }
    return this.functionQueueMap[queueId].length
  }

  public async exec<T> (func: () => T, options: RateOptions = {}) {
    const queueId = options.queueId || 'default'
    const { delayAfter, delayBefore, uniqueKey } = options

    if (!this.functionQueueMap[queueId]) {
      this.functionQueueMap[queueId] = []
    }

    if (this.functionQueueMap[queueId].length > MAX_QUEUE_SIZE) {
      if (this.counter % MAX_QUEUE_SIZE === 0) {
        log.error(`EXCEED_QUEUE_SIZE: Max queue size for id: ${queueId} reached: ${this.functionQueueMap[queueId].length} > ${MAX_QUEUE_SIZE}(max queue size). Drop these tasks.`)
        this.counter = 0
      }
      this.counter++
    }

    return new Promise<T>(async (resolve, reject) => {
      this.functionQueueMap[queueId].push({ delayAfter, delayBefore, func, reject, resolve, uniqueKey })
      if (!this.runningMap[queueId]) {
        this.runningMap[queueId] = true
        await this.execNext(queueId)
      }
    })
  }

  private async execNext (queueId: string) {
    const queue = this.functionQueueMap[queueId]
    if (!queue) {
      return
    }

    const funcObj = queue.shift()
    if (!funcObj) {
      throw new Error(`can not get funcObj from queue with id: ${queueId}.`)
    }
    const { delayAfter, delayBefore, func, resolve, reject, uniqueKey } = funcObj
    await sleep(delayBefore)
    try {
      const result = await func()
      resolve(result)
      /**
       * If uniqueKey is given, will resolve functions with same key in the queue
       */
      if (uniqueKey) {
        const sameFuncIndexes = queue.map((f, index) => ({ func: f, index }))
          .filter(o => o.func.uniqueKey === uniqueKey)
          .map(o => o.index)
          .sort((a, b) => b - a)
        for (const index of sameFuncIndexes) {
          const [sameFunc] = queue.splice(index, 1)
          sameFunc.resolve(result)
        }
      }
    } catch (e) {
      reject(e)
    }
    await sleep(delayAfter)
    if (queue.length > 0) {
      await this.execNext(queueId)
    } else {
      delete this.runningMap[queueId]
    }
  }

}
