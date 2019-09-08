import { log } from '../../config'
import { PadplusContactPayload, GrpcContactPayload } from '../../schemas'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';
import { convertFromGrpcContact } from '../../convert-manager/contact-convertor';

const PRE = 'PadplusContact'

export class PadplusContact {

  private requestClient: RequestClient

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }
  // Query contact list info
  public getContactInfo = async (loginId: string, contactId: string): Promise<PadplusContactPayload> => {
    log.verbose(PRE, `getContactInfo(${loginId}, ${contactId})`)

    const data = {
      account: contactId,
      my_account: loginId,
    }
    const res = await this.requestClient.request({
      apiType: ApiType.GET_CONTACT,
      data,
    })
    log.silly(PRE, `get contact info from API : ${JSON.stringify(res)}`)
    const json = res.getData()
    if (!json) {
      throw new Error(`can not find contact.`)
    }
    const rawContact: GrpcContactPayload = JSON.parse(json)
    const padplusContact = convertFromGrpcContact(rawContact)
    return padplusContact
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
      data,
    })
    return true
  }

  public syncContacts = async (uin: string): Promise<void> => {
    log.verbose(PRE, `contactList(${uin})`)

    const data = {
      uin,
    }

    await this.requestClient.request({
      apiType: ApiType.SYNC_CONTACT,
      data,
    })
  }
}
