import { RequestClient } from './request'
import { log } from '../../config'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { LogoutGrpcResponse } from '../../schemas'

const PRE = 'PadplusUser'
export class PadplusUser {

  private requestClient: RequestClient
  // private token: string

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // init
  public async initInstance () {
    log.silly(PRE, `initInstance()`)
    await this.requestClient.request({
      apiType: ApiType.INIT,
    })
  }

  // grpc server reconnect
  public async reconnect () {
    log.silly(PRE, `reconnect()`)
    await this.requestClient.request({
      apiType: ApiType.RECONNECT,
    })
  }

  // logout WeChat
  public async logout (wxid: string): Promise<boolean> {
    log.silly(PRE, `logout()`)
    const data = {
      wxid,
    }
    const res = await this.requestClient.request({
      apiType: ApiType.LOGOUT,
      data,
    })
    if (!res) {
      log.error(PRE, `can not get callback result of LOGOUT`)
      return false
    } else {
      const resultStr = res.getData()
      if (resultStr) {
        const result: LogoutGrpcResponse = JSON.parse(resultStr)
        if (result && result.code === 200 && result.mqType === 1100) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    }
  }

  // get qrcode for login WeChat
  public getWeChatQRCode = async (data?: {uin: string, wxid: string}) => {
    if (data) {
      const res = await this.requestClient.request({
        apiType: ApiType.GET_QRCODE,
        data,
      })
      log.silly(PRE, `Get qrcode with user info, res : ${JSON.stringify(res)}`)
      return res
    } else {
      const res = await this.requestClient.request({
        apiType: ApiType.GET_QRCODE,
      })
      log.silly(PRE, `Get qrcode without user info, res : ${JSON.stringify(res)}`)
      return res
    }
  }

}
