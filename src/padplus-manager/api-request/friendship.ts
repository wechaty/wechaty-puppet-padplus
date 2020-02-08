import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { AddContactGrpcResponse } from '../../schemas'

const PRE = 'PadplusFriendship'

export class PadplusFriendship {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // confirm friendship
  public confirmFriendship = async (encryptUserName: string, ticket: string, scene: string): Promise<boolean> => {
    log.verbose(PRE, `confirmFriendship()`)

    const data = {
      type: scene,
      userName: encryptUserName,
      verifyUserTicket: ticket,
    }

    await this.requestClient.request({
      apiType: ApiType.ACCEPT_CONTACT,
      data,
    })
    return true
  }

  public addFriend = async (strangerV1: string, strangerV2: string, isPhoneNumber: number, contactId: string, hello: string | undefined,): Promise<AddContactGrpcResponse> => {
    log.verbose(PRE, `addFriend()`)

    const data = {
      type: isPhoneNumber,
      userName: contactId,
      v1: strangerV1,
      v2: strangerV2,
      verify: hello,
    }

    const result = await this.requestClient.request({
      apiType: ApiType.ADD_CONTACT,
      data,
    })

    if (result) {
      const addFriendStr = result.getData()
      if (addFriendStr) {
        return JSON.parse(addFriendStr)
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result of ADD_CONTACT`)
    }
  }

}
