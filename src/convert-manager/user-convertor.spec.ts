import test from 'blue-tape'
import { GrpcQrCode, PadplusQrcode, GrpcQrCodeLogin, PadplusQrcodeLogin, QrcodeStatus, LoginStatus, GrpcQrCodeStatus, PadplusQrcodeStatus } from '../schemas'

import { convertToQrcode, convertToQrcodeLogin, convertToQrcodeStatus } from './user-convertor'

test('Convert grpc qrcode to padplus qrcode', async t => {
  const grpcQrCode: GrpcQrCode = {
    qrcodeId: 'string',
    qrcode: 'string',
  }

  const padplusQrCode: PadplusQrcode = {
    qrcodeId: 'string',
    qrcode: 'string',
  }

  const payload = convertToQrcode(grpcQrCode)
  t.deepEqual(payload, padplusQrCode, 'should parse grpc qrcode to a padplus qrcode')
})

test('Convert grpc qrcode to padplus qrcode', async t => {
  const grpcQrCode: GrpcQrCode = {
    qrcodeId: 'string',
    qrcode: 'string',
  }

  const padplusQrCode: PadplusQrcode = {
    qrcodeId: 'string',
    qrcode: 'number',
  }

  const payload = convertToQrcode(grpcQrCode)
  t.deepEqual(payload, padplusQrCode, 'should not parse grpc qrcode to a padplus qrcode')
})

test('Convert grpc qrcodelogin to padplus qrcodelogin', async t => {
  const grpcQrCodeLogin: GrpcQrCodeLogin = {
    headImgUrl: 'string',
    nickName: 'string',
    status: 1,
    uin: 'string',
    userName: 'string',
    verifyFlag: 'string',
  }

  const padplusQrCodeLogin: PadplusQrcodeLogin = {
    headImgUrl: 'string',
    nickName: 'string',
    status: LoginStatus.Logined,
    uin: 'string',
    userName: 'string',
    verifyFlag: 'string',
  }

  const payload = convertToQrcodeLogin(grpcQrCodeLogin)
  t.deepEqual(payload, padplusQrCodeLogin, 'should parse grpc qrcodelogin to a padplus qrcodelogin')
})
test('Convert grpc qrcodelogin to padplus qrcodelogin', async t => {
  const grpcQrCodeLogin: GrpcQrCodeLogin = {
    headImgUrl: 'string',
    nickName: 'string',
    status: 1,
    uin: 'string',
    userName: 'string',
    verifyFlag: 'string',
  }

  const padplusQrCodeLogin: PadplusQrcodeLogin = {
    headImgUrl: 'string',
    nickName: 'string',
    status: LoginStatus.Logined,
    uin: 'string',
    userName: 'string',
    verifyFlag: 'number',
  }

  const payload = convertToQrcodeLogin(grpcQrCodeLogin)
  t.deepEqual(payload, padplusQrCodeLogin, 'should not parse grpc qrcodelogin to a padplus qrcodelogin')
})


test('Convert grpc qrcodestatus to padplus qrcode', async t => {
  const grpcQrCodeStatus: GrpcQrCodeStatus = {
    nick_name: 'string',
    head_url: 'string',
    user_name: 'string',
    status: 1,
  }

  const padplusQrCodeStatus: PadplusQrcodeStatus = {
    nickName: 'string',
    headUrl: 'string',
    userName: 'string',
    status: QrcodeStatus.Waiting,
  }

  const payload = convertToQrcodeStatus(grpcQrCodeStatus)
  t.deepEqual(payload, padplusQrCodeStatus, 'should parse grpc qrcodestatus to a padplus qrcodestatus')
})

test('Convert grpc qrcodestatus to padplus qrcode', async t => {
  const grpcQrCodeStatus: GrpcQrCodeStatus = {
    nick_name: 'string',
    head_url: 'string',
    user_name: 'aaa',
    status: 1,
  }

  const padplusQrCodeStatus: PadplusQrcodeStatus = {
    nickName: 'string',
    headUrl: 'string',
    userName: 'string',
    status: QrcodeStatus.Waiting,
  }

  const payload = convertToQrcodeStatus(grpcQrCodeStatus)
  t.deepEqual(payload, padplusQrCodeStatus, 'should not parse grpc qrcodestatus to a padplus qrcodestatus')
})

