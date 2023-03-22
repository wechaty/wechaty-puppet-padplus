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

export const PADPLUS_REPLAY_MESSAGE = process.env.PADPLUS_REPLAY_MESSAGE === 'true'

/**
 * GRPC server
 */
const WECHATY_PUPPET_PADPLUS_ENDPOINT_ENV_VAR = 'WECHATY_PUPPET_PADPLUS_ENDPOINT'
export const GRPC_ENDPOINT = process.env[WECHATY_PUPPET_PADPLUS_ENDPOINT_ENV_VAR]  || 'beijing.padplus.juzibot.com:50052'

export const MESSAGE_CACHE_AGE = 1000 * 60 * 60
export const MESSAGE_CACHE_MAX = 1000

export const WAIT_FOR_READY_TIME = 1000 * 60 * 10

export const COMPACT_CACHE_FIRST_START = 1000 * 60 * 15

export const COMPACT_CACHE_INTERVAL = 1000 * 60 * 60

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
