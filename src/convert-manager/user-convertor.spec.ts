import test from 'blue-tape'
import { GrpcQrCode, PadplusQrcode } from '../schemas'

import { convertToQrcode } from './user-convertor'

test('Official account sent url', async t => {
  const grpcQrCode: GrpcQrCode = {
    qrcodeId: 'string',
    qrcode: 'string',
  }

  const padplusQrCode: PadplusQrcode = {
    qrcodeId: 'string',
    qrcode: 'string',
  }

  const payload = convertToQrcode(grpcQrCode)
  t.deepEqual(payload, padplusQrCode, 'should parse official account sent url')
})
