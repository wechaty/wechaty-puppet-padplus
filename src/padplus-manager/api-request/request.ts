import AWS from 'aws-sdk'

import { log, AWS_S3 } from '../../config'
import { GrpcGateway } from '../../server-manager/grpc-gateway'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';

export interface RequestOption {
  data?: any,
  uin: string,
  apiType: ApiType,
}

const PRE = 'REQUEST'

export class RequestClient {

  private grpcGateway: GrpcGateway

  constructor (grpcGateway: GrpcGateway) {
    this.grpcGateway = grpcGateway
  }

  public async request (option: RequestOption) {
    log.silly(PRE, `request()`)
    const res = await this.grpcGateway.request(option.apiType, option.uin, option.data)
    log.silly(PRE, `REQUEST res : ${JSON.stringify(res)}`)
    return res
  }

  public async uploadFile (filename: string, stream: NodeJS.ReadableStream) {
    log.silly(PRE, `stream length : ${stream}`)
    let option: AWS.S3.PutObjectRequest = {
      ACL: 'public-read',
      Body: stream,
      Bucket: AWS_S3.BUCKET,
      Key: AWS_S3.PATH + filename,
    }
    // TODO: 增加分块上传机制
    /* let parts = {
      partSize: 10 * 1024 * 1024,
      queueSize: 1,
    } */
    AWS.config.accessKeyId = AWS_S3.ACCESS_KEY_ID
    AWS.config.secretAccessKey = AWS_S3.SECRET_ACCESS_KEY

    const s3 = new AWS.S3({ region: 'cn-northwest-1', signatureVersion: 'v4' })
    const result = await new Promise<AWS.S3.ManagedUpload.SendData>((resolve, reject) => {
      s3.upload(option, (err, data) => {
        if (err) {
          reject(err)
        } else {
          log.silly(PRE, `err : ${err}, data : ${JSON.stringify(data)}`)
          resolve(data)
        }
      })
    })
    const location = result.Location
    const _location = location.split('image-message')[0] + option.Key
    return _location
  }
}
