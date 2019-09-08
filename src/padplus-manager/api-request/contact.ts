import { ContactGender } from 'wechaty-puppet'
import { log } from '../config'
import { RequestStatus } from '../schemas'
import { AliasModel, MacproContactPayload } from '../schemas/contact'
import { RequestClient } from '../utils/request'

const PRE = 'MacproContact'

export default class MacproContact {

  private requestClient: RequestClient

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }
  // Query contact list info
  public getContactInfo = async (loginId: string, contactId: string): Promise<MacproContactPayload> => {
    log.verbose(PRE, `getContactInfo(${loginId}, ${contactId})`)

    const data = {
      account: contactId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'getContactInfo',
      data,
    })
    log.silly(PRE, `get contact info from API : ${JSON.stringify(res)}`)
    const contactRawPayload: MacproContactPayload = {
      account: res.account,
      accountAlias: res.name_remark,
      area: res.area,
      description: res.description,
      disturb: res.disturb,
      formName: res.form_name,
      name: res.name,
      sex: parseInt(res.sex, 10) as ContactGender,
      thumb: res.thumb,
      v1: res.v1 || '',
    }

    return contactRawPayload
  }

  // Set alias for contact
  public setAlias = async (aliasModel: AliasModel): Promise<RequestStatus> => {
    log.verbose(PRE, `setAlias()`)

    const data = {
      my_account: aliasModel.loginedId,
      remark: aliasModel.remark,
      to_account: aliasModel.contactId,
    }

    const res = await this.requestClient.request({
      apiName: 'modifyFriendAlias',
      data,
    })

    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // config callback endpoint for getting contact list
  public contactList = async (loginId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `contactList(${loginId})`)

    const data = {
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'getContactList',
      data,
    })

    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
