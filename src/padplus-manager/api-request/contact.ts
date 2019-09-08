import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';
import { GrpcEventEmitter } from '../../server-manager/grpc-event-emitter';

const PRE = 'PadplusContact'

export class PadplusContact {

  private requestClient: RequestClient
  private emitter: GrpcEventEmitter
  constructor (requestClient: RequestClient, emitter: GrpcEventEmitter) {
    this.requestClient = requestClient
    this.emitter = emitter
  }
  // Query contact list info
  public getContactInfo = async (userName: string, roomId?: string): Promise<boolean> => {
    log.verbose(PRE, `getContactInfo(${userName})`)

    const data = {
      userName,
    }
    await this.requestClient.request({
      apiType: ApiType.GET_CONTACT,
      uin: this.emitter.getUIN(),
      data,
    })
    return true
  }

  // Set alias for contact
  public setAlias = async (selfId: string, contactId: string, alias: string): Promise<boolean> => {
    log.verbose(PRE, `setAlias()`)

    const data = {
      selfId,
      contactId,
      alias,
    }

    await this.requestClient.request({
      apiType: ApiType.SEARCH_CONTACT,
      uin: this.emitter.getUIN(),
      data,
    })
    return true
  }

  public syncContacts = async (uin: string): Promise<void> => {
    log.verbose(PRE, `contactList(${uin})`)

    await this.requestClient.request({
      apiType: ApiType.SYNC_CONTACT,
      uin: this.emitter.getUIN(),
    })
  }
}
