import { RequestClient } from './request'
import { log } from '../../config'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { LogoutGrpcResponse, GrpcLoginDeviceInfo, LoginDeviceInfo } from '../../schemas'

const PRE = 'PadplusUser'
export class PadplusUser {

  private requestClient: RequestClient
  // private token: string

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // init
  public async initInstance (): Promise<boolean> {
    log.silly(PRE, `initInstance()`)
    const res = await this.requestClient.request({
      apiType: ApiType.INIT,
    })
    if (!res) {
      log.error(PRE, `can not get callback result of INIT`)
      return false
    }
    const resultStr = res.getData()
    const result = JSON.parse(resultStr)
    if (result && result.message !== 'success') {
      return false
    }
    log.silly(PRE, `init success`)
    return false
  }

  // grpc server reconnect
  public async reconnect () {
    log.silly(PRE, `reconnect()`)
    await this.requestClient.request({
      apiType: ApiType.RECONNECT,
    })
  }

  public async loginDevice (): Promise<LoginDeviceInfo> {
    log.silly(PRE, `loginDevice()`)

    const res = await this.requestClient.request({
      apiType: ApiType.LOGIN_DEVICE,
    })

    if (!res) {
      throw new Error(`can not get callback result of LOGIN_DEVICE`)
    } else {
      const resultStr = res.getData()
      if (resultStr) {
        const result: GrpcLoginDeviceInfo = JSON.parse(resultStr)
        const loginDeviceInfo: LoginDeviceInfo = {
          childId: result.childId,
          deviceName: result.deviceInfo.deviceName,
          headImgUrl: result.headImgUrl,
          loginType: result.loginType,
          nickName: result.nickName,
          token: result.token,
          uin: result.uin,
          userName: result.userName,
          wechatUserId: result.wechatUserId,
        }
        return loginDeviceInfo
      } else {
        throw new Error(`can not parse result of LOGIN_DEVICE`)
      }
    }
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
