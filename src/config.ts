import { log } from 'brolog'
import { OperationOptions } from 'retry'
import promiseRetry = require('promise-retry')

export const padplusToken = () => {
  const token = process.env.WECHATY_PUPPET_PADPLUS_TOKEN as string
  if (!token) {
    log.error('PuppetPadplusConfig', `

      WECHATY_PUPPET_PADPLUS_TOKEN environment variable not found.

      PuppetPadplus need a token before it can be used,
      Please set WECHATY_PUPPET_PADPLUS_TOKEN then retry again.

    `)
    throw new Error('You need a valid WECHATY_PUPPET_PADPLUS_TOKEN to use PuppetPadplus')
  }
  return token
}

export const NO_USER_INFO_IN_REDIS = `


===========================================================================================

      WARNING!!! Something wrong with your memory-card file!
      Please remove it and restart the bot, then it will be ok.
      This default path of memory-card file in the root dir of your project,
      Path like: ${process.cwd()}/your-name-memory-card.json

      MemoryCard文件出现问题，请删除后重启bot，即可正常使用。
      MemoryCard文件默认在项目根目录下，路径示例：${process.cwd()}/your-name-memory-card.json

===========================================================================================


`

export const INVALID_TOKEN_MESSAGE = `


===========================================================================================

      The token is invalid, please use an valid token to access padplus
      See: https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty

      你使用的Token是无效的，请使用有效Token
      更多详情参见：https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty

============================================================================================


`

export const EXPIRED_TOKEN_MESSAGE = `


===========================================================================================

      The token you are using is expired, please renew this token
      See: https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty

      你使用的Token已经过期了，如果你想继续使用wechaty-puppet-padplus，请续费你的Token
      更多详情参见：https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty

============================================================================================


`

const SECOND = 1000
const MINUTE = 60 * SECOND

export const PADPLUS_REPLAY_MESSAGE = process.env.PADPLUS_REPLAY_MESSAGE === 'true'

/**
 * GRPC server
 */
const WECHATY_PUPPET_PADPLUS_ENDPOINT_ENV_VAR = 'WECHATY_PUPPET_PADPLUS_ENDPOINT'
export const GRPC_ENDPOINT = process.env[WECHATY_PUPPET_PADPLUS_ENDPOINT_ENV_VAR]  || 'beijing.padplus.juzibot.com:50052'

export const MESSAGE_CACHE_AGE = 60 * MINUTE
export const MESSAGE_CACHE_MAX = SECOND

export const WAIT_FOR_READY_TIME = 10 * MINUTE

export const COMPACT_CACHE_FIRST_START = 15 * MINUTE

export const COMPACT_CACHE_INTERVAL = 60 * MINUTE

// sync data timeout in minute
export const SYNC_CONTACT_TIMEOUT = (Number(process.env.SYNC_CONTACT_TIMEOUT) || 2) * MINUTE
export const SYNC_ROOM_TIMEOUT = (Number(process.env.SYNC_ROOM_TIMEOUT) || 2) * MINUTE
export const SYNC_MEMBER_TIMEOUT = (Number(process.env.SYNC_MEMBER_TIMEOUT) || 2) * MINUTE

// delay get data interval in second
export const MEMBER_DELAY_INTERVAL = (Number(process.env.MEMBER_DELAY_INTERVAL) || 0.5) * SECOND

// Expire time for api call data that persist in the pool
// Number of seconds
export const EXPIRE_TIME = (Number(process.env.EXPIRE_TIME) || 1) * SECOND

const logLevel = process.env.PADPLUS_LOG || process.env.WECHATY_LOG
if (logLevel) {
  log.level(logLevel.toLowerCase() as any)
  log.silly('Config', 'PADPLUS_LOG set level to %s', logLevel)
}

export {
  log,
}

export const GRPC_LIMITATION = {
  'grpc.max_receive_message_length': 1024 * 1024 * 150,
  'grpc.max_send_message_length': 1024 * 1024 * 150,
}

export async function retry<T> (
  retryableFn: (
    retry: (error: Error) => never,
    attempt: number,
    ) => Promise<T>,
  num?: number,
): Promise<T> {
  const factor     = 3
  const minTimeout = 10
  const maxTimeout = (num || 20) * 1000
  const retries    = 9

  const retryOptions: OperationOptions = {
    factor,
    maxTimeout,
    minTimeout,
    retries,
  }
  return promiseRetry(retryOptions, retryableFn)
}
