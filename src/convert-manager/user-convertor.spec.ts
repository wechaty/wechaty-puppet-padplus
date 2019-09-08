/* eslint-disable */
import test from 'blue-tape'
import { GrpcQrCode, PadplusQrcode, GrpcQrCodeLogin, PadplusQrcodeLogin, QrcodeStatus, LoginStatus, GrpcQrCodeStatus, PadplusQrcodeStatus } from '../schemas'

import { convertToQrcode, convertToQrcodeLogin, convertToQrcodeStatus } from './user-convertor'

test('Convert grpc qrcode to padplus qrcode', async t => {
  const grpcQrCode: GrpcQrCode = {
    qrcode: 'string',
    qrcodeId: 'string',
  }

  const padplusQrCode: PadplusQrcode = {
    qrcode: 'string',
    qrcodeId: 'string',
  }

  const payload = convertToQrcode(grpcQrCode)
  t.deepEqual(payload, padplusQrCode, 'should parse grpc qrcode to a padplus qrcode')
})

test('Convert grpc qrcode to padplus qrcode', async t => {
  const grpcQrCode: GrpcQrCode = {
    qrcode: 'string',
    qrcodeId: 'string',
  }

  const padplusQrCode: PadplusQrcode = {
    qrcode: 'number',
    qrcodeId: 'string',
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
    head_url: 'string',
    nick_name: 'string',
    status: 1,
    user_name: 'string',
  }

  const padplusQrCodeStatus: PadplusQrcodeStatus = {
    headUrl: 'string',
    nickName: 'string',
    status: QrcodeStatus.Waiting,
    userName: 'string',
  }

  const payload = convertToQrcodeStatus(grpcQrCodeStatus)
  t.deepEqual(payload, padplusQrCodeStatus, 'should parse grpc qrcodestatus to a padplus qrcodestatus')
})

test('Convert grpc qrcodestatus to padplus qrcode', async t => {
  const grpcQrCodeStatus: GrpcQrCodeStatus = {
    head_url: 'string',
    nick_name: 'string',
    status: 1,
    user_name: 'aaa',
  }

  const padplusQrCodeStatus: PadplusQrcodeStatus = {
    headUrl: 'string',
    nickName: 'string',
    status: QrcodeStatus.Waiting,
    userName: 'string',
  }

  const payload = convertToQrcodeStatus(grpcQrCodeStatus)
  t.deepEqual(payload, padplusQrCodeStatus, 'should not parse grpc qrcodestatus to a padplus qrcodestatus')
})