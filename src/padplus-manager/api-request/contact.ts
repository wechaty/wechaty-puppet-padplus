import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { GrpcSearchContact } from '../../schemas'

const PRE = 'PadplusContact'

export class PadplusContact {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  public async newTag (tag: string): Promise<string> {
    log.verbose(PRE, `newTag(${tag})`)

    const data = {
      tag,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.ADD_LABEL,
      data,
    })
    if (result) {
      const labelStr = result.getData()
      if (labelStr) {
        const label = JSON.parse(labelStr)
        const labelID = label.labelList && label.labelList[0].LabelID
        return labelID
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result`)
    }
  }

  public async addTag (contactId: string, tag: string): Promise<void> {
    log.verbose(PRE, `addTag(${tag})`)

    const data = {
      labelIds: tag,
      userName: contactId,
    }
    await this.requestClient.request({
      apiType: ApiType.MODIFY_LABEL,
      data,
    })
  }

  public async tagList (): Promise<string> {
    log.verbose(PRE, `tagList()`)

    const result = await this.requestClient.request({
      apiType: ApiType.GET_ALL_LABEL,
    })
    if (result) {
      const labelStr = result.getData()
      if (labelStr) {
        const label = JSON.parse(labelStr)
        let labelIds = ''
        if (label.labelList && label.labelList.length > 0) {
          label.labelList.map((labelItem: any, index: number) => {
            if (index === label.labelList.length - 1) {
              labelIds += labelItem.LabelID
            } else {
              labelIds += labelItem.LabelID + ','
            }
          })
        }
        return labelIds
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result`)
    }
  }

  // Query contact list info
  public getContactInfo = async (userName: string): Promise<boolean> => {
    log.verbose(PRE, `getContactInfo(${userName})`)

    const data = {
      userName,
    }
    await this.requestClient.request({
      apiType: ApiType.GET_CONTACT,
      data,
    })
    return true
  }

  public searchContact = async (contactId: string): Promise<GrpcSearchContact> => {
    log.verbose(PRE, `searchContact(${contactId})`)

    const data = {
      wxid: contactId,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.SEARCH_CONTACT,
      data,
    })

    if (result) {
      const contactStr = result.getData()
      if (contactStr) {
        return JSON.parse(contactStr)
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result`)
    }
  }

  // Set alias for contact
  public setAlias = async (contactId: string, alias: string): Promise<boolean> => {
    log.verbose(PRE, `setAlias()`)

    const data = {
      newRemarkName: alias,
      userName: contactId,
    }

    await this.requestClient.request({
      apiType: ApiType.CONTACT_ALIAS,
      data,
    })
    return true
  }

  public syncContacts = async (): Promise<void> => {
    log.verbose(PRE, `syncContacts()`)

    await this.requestClient.request({
      apiType: ApiType.SYNC_CONTACT,
    })
  }

}
