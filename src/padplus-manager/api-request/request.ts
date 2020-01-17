import AWS from 'aws-sdk'

import { log, AWS_S3 } from '../../config'
import { GrpcGateway } from '../../server-manager/grpc-gateway'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { GrpcEventEmitter } from '../../server-manager/grpc-event-emitter'
import { DedupeApi } from './dedupeApi'

export interface RequestOption {
  data?: any,
  apiType: ApiType,
}

const PRE = 'RequestClient'

export class RequestClient {

  private grpcGateway: GrpcGateway
  private emitter: GrpcEventEmitter
  private dedupeApi: DedupeApi

  constructor (grpcGateway: GrpcGateway, emitter: GrpcEventEmitter) {
    this.grpcGateway = grpcGateway
    this.emitter = emitter
    this.dedupeApi = new DedupeApi()
  }

  public async request (option: RequestOption) {
    log.silly(PRE, `request()`)
    let uin
    if (option.apiType === ApiType.GET_QRCODE) {
      uin = this.emitter.getUIN() || (option.data && option.data.uin)
    } else {
      uin = this.emitter.getUIN()
    }
    return this.dedupeApi.dedupe(
      this.grpcGateway.request.bind(this.grpcGateway),
      option.apiType,
      uin,
      option.data,
    )
  }

  public async uploadFile (filename: string, stream: NodeJS.ReadableStream) {
    let params: AWS.S3.PutObjectRequest = {
      ACL: 'public-read',
      Body: stream,
      Bucket: AWS_S3.BUCKET,
      Key: AWS_S3.PATH + '/' + filename,
    }
    AWS.config.accessKeyId = AWS_S3.ACCESS_KEY_ID
    AWS.config.secretAccessKey = AWS_S3.SECRET_ACCESS_KEY

    const s3 = new AWS.S3({ region: 'cn-northwest-1', signatureVersion: 'v4' })
    const result = await new Promise<AWS.S3.ManagedUpload.SendData>((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    const location = result.Location
    const _location = location.split(AWS_S3.PATH)[0] + encodeURIComponent(params.Key)
    return _location
  }

}
