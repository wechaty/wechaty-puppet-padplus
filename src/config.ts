import { log }      from 'brolog'
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

/**
 * GRPC server
 */
export const GRPC_ENDPOINT = '' // Padpuls-Server Endpoint

export {
  log,
}

export const MESSAGE_CACHE_AGE = 1000 * 60 * 60
export const MESSAGE_CACHE_MAX = 1000

export const AWS_S3 = {
  ACCESS_KEY_ID: 'AKIA3PQY2OQG5FEXWMH6',
  BUCKET: 'macpro-message-file',
  EXPIRE_TIME: 3600 * 24 * 3,
  PATH: 'image-message/',
  SECRET_ACCESS_KEY: 'jw7Deo+W8l4FTOL2BXd/VubTJjt1mhm55sRhnsEn',
}

// TODO: maybe could change <retry> module to <axios-retry> module
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
