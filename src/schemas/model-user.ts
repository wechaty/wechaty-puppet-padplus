import { QrcodeStatus, LoginStatus } from './padplus-enums'

export interface PadplusQrcode {
  qrcodeId: string,
  qrcode: string,
}

export interface PadplusQrcodeStatus {
  headUrl: string,
  userName: string,
  nickName: string,
  status: QrcodeStatus,
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
  msg: string,
  loginer: string,
  head_url: string,
  user_name: string,
  nick_name: string,
  event: string,
  qrcodeId: string,
  serverId: string,
  status: number,
}

export interface ScanData {
  head_url: string,
  msg: string,
  nick_name: string,
  qrcodeId: string,
  status: number,
  user_name: string,
}