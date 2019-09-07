import { log, AWS_S3, retry } from '../../config'
import { GrpcGateway } from '../../server-manager/grpc-gateway'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';

export interface RequestOption {
  data?: any,
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
    const result = await retry(async (retryException) => {
      const res = await this.grpcGateway.request(option.apiType, option.data)
      if (res) {
        return res
      }
      return retryException(new Error('tryRawPayload empty'))
    })

    return result
  }
}
