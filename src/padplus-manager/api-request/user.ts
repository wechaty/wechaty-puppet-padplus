import { RequestClient } from './request'
import { RequestStatus } from '../../schemas'
import { log } from '../../config'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';

const PRE = 'MAC_API_USER'

export class PadplusUser {

  private requestClient: RequestClient
  private token: string

  constructor (token: string, requestClient: RequestClient) {
    this.token = token
    this.requestClient = requestClient
  }

  // 获取微信登录二维码
  public getWeChatQRCode = async () => {
    log.silly(`==P==A==D==P==L==U==S==<GET QRCODE>==P==A==D==P==L==U==S==`)
    const res = await this.requestClient.request({apiType: ApiType.GET_QRCODE, data: JSON.stringify({loginer: '1'}) })
    log.silly(`USER API res : ${JSON.stringify(res)}`)
    return res
  }

  // 登出微信
  public logoutWeChat = async (account: string): Promise<RequestStatus> => {
    log.silly(PRE, `logoutWeChat(${account})`)

    const data = {
      my_account: account,
    }

    const res = await this.requestClient.request({
      apiName: 'logoutWeixin',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)

    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      throw new Error('logout wechat failed.')
    }
  }

  // 添加好友
  public addFriend = async (
    loginedId: string,
    account: string,
    content: string,
  ): Promise<RequestStatus> => {
    log.silly(PRE, `addFriend(${loginedId}, ${account}, ${content})`)

    const data = {
      account: account,
      content: content,
      my_account: loginedId,
    }

    const res = await this.requestClient.request({
      apiName: 'addFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // 删除好友
  public delFriend = async (loginedId: string, account: string): Promise<RequestStatus> => {
    log.silly(PRE, `delFriend(${loginedId}, ${account})`)

    const data = {
      my_account: loginedId,
      to_account: account,
    }

    const res = await this.requestClient.request({
      apiName: 'delFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // 自动通过好友
  public acceptFriend = async (loginedId: string, account: string): Promise<RequestStatus> => {
    log.silly(PRE, `acceptFriend(${loginedId}, ${account})`)

    const data = {
      account,
      my_account: loginedId,
    }

    const res = await this.requestClient.request({
      apiName: 'acceptFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
