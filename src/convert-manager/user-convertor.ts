import { log } from '../config'
import { GrpcQrCode, GrpcQrCodeStatus, GrpcQrCodeLogin } from '../schemas/grpc-schemas'
import { PadplusQrcode, PadplusQrcodeStatus, PadplusQrcodeLogin } from '../schemas/model-user'
import { QrcodeStatus, LoginStatus } from '../schemas'

const PRE = 'user-convertor'
export const convertToQrcode = (input: GrpcQrCode): PadplusQrcode => {
  try {
    const result: PadplusQrcode = {
      qrcodeId: input.qrcodeId,
      qrcode: input.qrcode,
    }
    return result
  }
  catch (err) {
    log.warn(PRE, `convert to PadplusQrcode error from input:${ JSON.stringify(input) }`)
    throw err
  }
}


export const convertToQrcodeStatus = (input: GrpcQrCodeStatus): PadplusQrcodeStatus => {
  try {
    const result: PadplusQrcodeStatus = {
      headUrl: input.head_url,
      userName: input.user_name,
      nickName: input.nick_name,
      status: QrcodeStatus.Waiting,
    }
    return result
  }
  catch (err) {
    log.warn(PRE, `convert to PadplusQrcodeStatus error from input:${ JSON.stringify(input) }`)
    throw err
  }
}


export const convertToQrcodeLogin = (input: GrpcQrCodeLogin): PadplusQrcodeLogin => {
  try {
    const result: PadplusQrcodeLogin = {
      headImgUrl: input.headImgUrl,
      nickName: input.nickName,
      status: LoginStatus.Logined,
      uin: input.uin,
      userName: input.userName,
      verifyFlag: input.verifyFlag,
    }
    return result
  }
  catch (err) {
    log.warn(PRE, `convert to PadplusQrcodeLogin error from input:${ JSON.stringify(input) }`)
    throw err
  }
}