import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { GrpcSearchContact } from '../../schemas'
import { LabelRawPayload } from '../../schemas/model-tag'

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
        let labelIDs = ''
        if (label.labelList && label.labelList.length > 0) {
          await Promise.all(label.labelList.map((labelItem: LabelRawPayload, index: number) => {
            if (index === label.labelList.length - 1) {
              labelIDs += labelItem.LabelID
            } else {
              labelIDs += labelItem.LabelID + ','
            }
          }))
        }
        return labelIDs
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result`)
    }
  }

  public async addTag (tagId: string, contactId: string): Promise<void> {
    log.verbose(PRE, `addTag(${tagId})`)

    const data = {
      labelIds: tagId,
      userName: contactId,
    }
    await this.requestClient.request({
      apiType: ApiType.MODIFY_LABEL,
      data,
    })
  }

  public async tagList (): Promise<LabelRawPayload []> {
    log.verbose(PRE, `tagList()`)

    const result = await this.requestClient.request({
      apiType: ApiType.GET_ALL_LABEL,
    })
    if (result) {
      const labelStr = result.getData()
      if (labelStr) {
        const label = JSON.parse(labelStr)

        return label.labelList
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
