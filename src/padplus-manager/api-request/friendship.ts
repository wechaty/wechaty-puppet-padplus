import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';
import { GrpcEventEmitter } from '../../server-manager/grpc-event-emitter';

const PRE = 'PadplusFriendship'

export class PadplusFriendship {

  private requestClient: RequestClient
  private emitter: GrpcEventEmitter
  constructor (requestClient: RequestClient, emitter: GrpcEventEmitter) {
    this.requestClient = requestClient
    this.emitter = emitter
  }

  // Set alias for contact
  public confirmFriendship = async (encryptUserName: string, ticket: string): Promise<boolean> => {
    log.verbose(PRE, `setAlias()`)

    const data = {
      userName: encryptUserName,
      verifyUserTicket: ticket,
      type: 3,
    }

    await this.requestClient.request({
      apiType: ApiType.ACCEPT_CONTACT,
      uin: this.emitter.getUIN(),
      data,
    })
    return true
  }
}
