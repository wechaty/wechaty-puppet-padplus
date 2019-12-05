/* eslint camelcase: 0 */
import { QrcodeStatus, LoginStatus } from './padplus-enums'

export interface PadplusQrcode {
  qrcode: string,
  qrcodeId: string,
}

export interface PadplusQrcodeStatus {
  headUrl: string,
  nickName: string,
  status: QrcodeStatus,
  userName: string,
}

export interface PadplusQrcodeLogin {
  headImgUrl: string,
  nickName: string,
  status: LoginStatus,
  uin: string,
  userName: string,
  verifyFlag: string,
}

export interface GrpcLoginData {
  event: string,
  head_url: string,
  loginer: string,
  msg: string,
  nick_name: string,
  qrcodeId: string,
  serverId: string,
  status: number,
  user_name: string,
}

export interface ScanData {
  head_url: string,
  msg: string,
  nick_name: string,
  qrcodeId: string,
  status: number,
  user_name: string,
}

export interface LogoutGrpcResponse {
  code: number,
  uin: string,
  message: string,
  mqType: number,
}
