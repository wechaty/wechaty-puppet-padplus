import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import {
  GrpcSearchContact,
  TagGrpcPayload,
  TagOtherOperationsGrpcResponse,
  TagNewOrListResponse,
  ContactQrcodeGrpcResponse,
  SetContactSelfInfoGrpcResponse,
  GetContactSelfInfoGrpcResponse,
} from '../../schemas'
import { convertTagStr } from '../../convert-manager/contact-convertor'

const PRE = 'PadplusContact'

export class PadplusContact {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  public async getOrCreateTag (tag: string): Promise<string> {
    log.verbose(PRE, `getOrCreateTag(${tag})`)

    const data = {
      name: tag,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.CREATE_TAG,
      data,
    })
    if (result) {
      const tagGrpcResponseStr = result.getData()
      if (tagGrpcResponseStr) {
        const tagListGrpcResponse: TagNewOrListResponse = convertTagStr(tagGrpcResponseStr)
        let tagIDs = ''
        if (tagListGrpcResponse.tagList && tagListGrpcResponse.tagList.length > 0) {
          await Promise.all(tagListGrpcResponse.tagList.map((tagItem: TagGrpcPayload, index: number) => {
            if (index === tagListGrpcResponse.tagList.length - 1) {
              tagIDs += tagItem.LabelID
            } else {
              tagIDs += tagItem.LabelID + ','
            }
          }))
        }
        return tagIDs
      } else {
        throw new Error(`getOrCreateTag can not parse data`)
      }
    } else {
      throw new Error(`getOrCreateTag can not get callback result`)
    }
  }

  public async tagList (): Promise<TagGrpcPayload []> {
    log.verbose(PRE, `tagList()`)

    const result = await this.requestClient.request({
      apiType: ApiType.GET_ALL_TAG,
    })
    if (result) {
      const tagGrpcResponseStr = result.getData()
      if (tagGrpcResponseStr) {
        const tagListGrpcResponse: TagNewOrListResponse = convertTagStr(tagGrpcResponseStr)

        return tagListGrpcResponse.tagList
      } else {
        throw new Error(`tagList can not parse data`)
      }
    } else {
      throw new Error(`tagList can not get callback result`)
    }
  }

  public async addTag (tagId: string, contactId: string): Promise<void> {
    log.verbose(PRE, `addTag(${tagId})`)

    const data = {
      labelIds: tagId,
      userName: contactId,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.ADD_TAG,
      data,
    })

    if (result) {
      const tagOperationsGrpcResponseStr = result.getData()
      if (tagOperationsGrpcResponseStr) {
        const tagOperationsGrpcResponse: TagOtherOperationsGrpcResponse = JSON.parse(tagOperationsGrpcResponseStr)
        if (tagOperationsGrpcResponse.status !== 0) {
          throw new Error(`Add operation failed!`)
        }
      } else {
        throw new Error(`addTag can not parse data`)
      }
    } else {
      throw new Error(`addTag can not get callback result`)
    }
  }

  public async modifyTag (tagId: string, name: string): Promise<void> {
    log.verbose(PRE, `modifyTag(${tagId}, ${name})`)

    const data = {
      labelId: tagId,
      labelName: name,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.MODIFY_TAG,
      data,
    })

    if (result) {
      const tagOperationsGrpcResponseStr = result.getData()
      if (tagOperationsGrpcResponseStr) {
        const tagOperationsGrpcResponse: TagOtherOperationsGrpcResponse = JSON.parse(tagOperationsGrpcResponseStr)
        if (tagOperationsGrpcResponse.status !== 0) {
          throw new Error(`Modify operation failed!`)
        }
      } else {
        throw new Error(`modifyTag can not parse data`)
      }
    } else {
      throw new Error(`modifyTag can not get callback result`)
    }
  }

  public async deleteTag (tagId: string): Promise<void> {
    log.verbose(PRE, `deleteTag(${tagId})`)

    const data = {
      labelIds: tagId,
    }
    const result = await this.requestClient.request({
      apiType: ApiType.DELETE_TAG,
      data,
    })

    if (result) {
      const tagOperationsGrpcResponseStr = result.getData()
      if (tagOperationsGrpcResponseStr) {
        const tagOperationsGrpcResponse: TagOtherOperationsGrpcResponse = JSON.parse(tagOperationsGrpcResponseStr)
        if (tagOperationsGrpcResponse.status !== 0) {
          throw new Error(`Delete operation failed!`)
        }
      } else {
        throw new Error(`deleteTag can not parse data`)
      }
    } else {
      throw new Error(`deleteTag can not get callback result`)
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
      throw new Error(`can not get callback result of SEARCH_CONTACT`)
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

  public contactSelfQrcode = async (): Promise<string> => {
    log.verbose(PRE, `contactSelfQrcode()`)

    const data = {
      style: 0, // set what style you want to get, you can get this value from the former result
      type: 1, // operation type, 0: change style, 1: get qrcode, 2: reset qrcode
    }

    const result = await this.requestClient.request({
      apiType: ApiType.GET_CONTACT_SELF_QRCODE,
      data,
    })

    if (result) {
      const contactQrcodeStr = result.getData()
      if (contactQrcodeStr) {
        const contactQrcode: ContactQrcodeGrpcResponse = JSON.parse(contactQrcodeStr)
        if (contactQrcode.status === 0) {
          return contactQrcode.qrcodeBuf
        } else {
          throw new Error(`Can not get contact self qrcode buffer.`)
        }
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result of GET_CONTACT_SELF_QRCODE`)
    }
  }

  public setContactSelfInfo = async (data: Object): Promise<void> => {
    log.verbose(PRE, `setContactSelfInfo()`)

    const result = await this.requestClient.request({
      apiType: ApiType.SET_CONTACT_SELF_INFO,
      data,
    })

    if (result) {
      const setContactSelfInfoStr = result.getData()
      if (setContactSelfInfoStr) {
        const setContactSelfInfoGrpcResponse: SetContactSelfInfoGrpcResponse = JSON.parse(setContactSelfInfoStr)
        if (setContactSelfInfoGrpcResponse.status !== 0) {
          throw new Error(`Can not set contact self ${Object.keys(data).join(',')}.`)
        } else {
          log.silly(PRE, `update info : ${JSON.stringify(setContactSelfInfoGrpcResponse.updateData)}`)
        }
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result of SET_CONTACT_SELF_INFO`)
    }
  }

  public getContactSelfInfo = async (): Promise<GetContactSelfInfoGrpcResponse> => {
    log.verbose(PRE, `getContactSelfInfo()`)

    const result = await this.requestClient.request({
      apiType: ApiType.GET_CONTACT_SELF_INFO,
    })

    if (result) {
      const getContactSelfInfoStr = result.getData()
      if (getContactSelfInfoStr) {
        const getContactSelfInfoGrpcResponse: GetContactSelfInfoGrpcResponse = JSON.parse(getContactSelfInfoStr)
        if (getContactSelfInfoGrpcResponse.status !== 0) {
          throw new Error(`Can not get contact self info.`)
        } else {
          return getContactSelfInfoGrpcResponse
        }
      } else {
        throw new Error(`can not parse data`)
      }
    } else {
      throw new Error(`can not get callback result of GET_CONTACT_SELF_INFO`)
    }
  }

}
