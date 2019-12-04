import { RequestClient } from './request'
import { log } from '../../config'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'

const PRE = 'USER'
export class PadplusUser {

  private requestClient: RequestClient
  // private token: string

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // 初始化登录信息
  public async initInstance () {
    log.silly(PRE, `initInstance()`)
    await this.requestClient.request({
      apiType: ApiType.INIT,
    })
  }

  // grpc server重连
  public async reconnect () {
    log.silly(PRE, `reconnect()`)
    await this.requestClient.request({
      apiType: ApiType.RECONNECT,
    })
  }

  // 获取微信登录二维码
  public getWeChatQRCode = async (data?: {uin: string, wxid: string}) => {
    if (data) {
      const res = await this.requestClient.request({
        apiType: ApiType.GET_QRCODE,
        data,
      })
      log.silly(`Get qrcode with user info, res : ${JSON.stringify(res)}`)
      return res
    } else {
      const res = await this.requestClient.request({
        apiType: ApiType.GET_QRCODE,
      })
      log.silly(`Get qrcode without user info, res : ${JSON.stringify(res)}`)
      return res
    }
  }

}
