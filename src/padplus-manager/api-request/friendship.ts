import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'

const PRE = 'PadplusFriendship'

export class PadplusFriendship {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // Set alias for contact
  public confirmFriendship = async (encryptUserName: string, ticket: string): Promise<boolean> => {
    log.verbose(PRE, `setAlias()`)

    const data = {
      type: 3,
      userName: encryptUserName,
      verifyUserTicket: ticket,
    }

    await this.requestClient.request({
      apiType: ApiType.ACCEPT_CONTACT,
      data,
    })
    return true
  }

}
