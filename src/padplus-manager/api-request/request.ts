import { log } from '../../config'
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

}
