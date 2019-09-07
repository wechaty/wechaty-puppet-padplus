import { RequestClient } from './request';
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';
import { log } from '../../config';

export class PadplusUser {
  private request: RequestClient
  constructor (request: RequestClient) {
    this.request = request
  }

  public getQrcode = async () => {
    log.silly(`==P==A==D==P==L==U==S==<GET QRCODE>==P==A==D==P==L==U==S==`)
    const res = await this.request.request({apiType: ApiType.GET_QRCODE, data: JSON.stringify({loginer: '1'}) })
    log.silly(`USER API res : ${JSON.stringify(res)}`)
    return res
  }
}