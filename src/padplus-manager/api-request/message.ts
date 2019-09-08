import { log } from '../../config'
import { RequestClient } from './request'
import { GrpcEventEmitter } from '../../server-manager/grpc-event-emitter';

const PRE = 'PadplusMessage'

export class PadplusMessage {

  private requestClient: RequestClient
  private emitter: GrpcEventEmitter
  constructor (requestClient: RequestClient, emmiter: GrpcEventEmitter) {
    this.requestClient = requestClient
    this.emitter = emmiter
    log.silly(PRE, `re : ${this.requestClient}`)
    log.silly(PRE, `emitter : ${this.emitter}`)
  }

  // Send message (text, image, url, video, file, gif)
  /* public sendMessage = async (contactId: string, contactIdOrRoomId: string, message: string, messageType: MacproMessageType, fileName?: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: message,
      content_type: messageType,
      file_name: fileName,
      my_account: contactId,
      to_account: contactIdOrRoomId,
    }

    const res = await this.requestClient.request({
      apiName: 'sendMessage',
      data,
    })
    log.silly(PRE, `sendMessage : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // Send url link
  public sendUrlLink = async (contactId: string, contactIdOrRoomId: string, urlLinkPayload: MacproUrlLink): Promise<RequestStatus> => {
    log.verbose(PRE, `sendUrlLink()`)

    const data = {
      describe: urlLinkPayload.description,
      my_account: contactId,
      thumb: urlLinkPayload.thumbnailUrl,
      title: urlLinkPayload.title,
      to_account: contactIdOrRoomId,
      url: urlLinkPayload.url,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUrlLink',
      data,
    })
    log.silly(PRE, `sendUrlLink : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // send contact card
  public sendContact = async (contactId: string, contactIdOrRoomId: string, cardName: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendContact()`)

    const data = {
      cardName,
      my_account: contactId,
      to_account: contactIdOrRoomId,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUserCard',
      data,
    })
    log.silly(PRE, `sendContact : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // send mini program
  public sendMiniProgram = async (miniProgram: MiniProgram) => {
    log.verbose(PRE, `sendMiniProgram()`)

    const data = {
      app_name: miniProgram.app_name,
      describe: miniProgram.describe || '',
      my_account: miniProgram.my_account,
      page_path: miniProgram.page_path || '',
      thumb_key: miniProgram.thumb_key || '',
      thumb_url: miniProgram.thumb_url || '',
      title: miniProgram.title,
      to_account: miniProgram.to_account,
      type: miniProgram.type || 1,
    }

    const res = await this.requestClient.request({
      apiType: 0,
      data,
    })
    log.silly(PRE, `sendMiniProgram : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  } */

}
