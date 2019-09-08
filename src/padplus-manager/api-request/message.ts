import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { GrpcEventEmitter } from '../../server-manager/grpc-event-emitter'
import { PadplusMessageType, RequestStatus } from '../../schemas'

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
  public sendMessage = async (selfId: string, receiverId: string, content: string, messageType: PadplusMessageType, mentionListStr?: string): Promise<boolean> => {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: content,
      fromUserName: selfId,
      messageType,
      toUserName: receiverId,
      mentionListStr,
    }

    const res = await this.requestClient.request({
      apiType: ApiType.SEND_MESSAGE,
      uin: this.emitter.getUIN(),
      data,
    })

    log.silly(PRE, `sendMessage : ${JSON.stringify(res)}`)
    return true
  }

  // Send url link
  public sendUrlLink = async (selfId: string, receiverId: string, content: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendUrlLink()`)

    await this.sendMessage(selfId, receiverId, content, PadplusMessageType.App)

    return RequestStatus.Success
  }

  // send contact card
  public sendContact = async (selfId: string, receiver: string, content: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendContact()`)

    await this.sendMessage(selfId, receiver, content, PadplusMessageType.ShareCard)
    return RequestStatus.Success
  }

  public sendFile = async (selfId: string, receiver: string, url: string, fileName: string, subType: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendFile()`)

    const data = {
      fileName,
      fromUserName: selfId,
      messageType: PadplusMessageType.Image,
      subType,
      toUserName: receiver,
      url,
    }

    const res = await this.requestClient.request({
      apiType: ApiType.SEND_FILE,
      uin: this.emitter.getUIN(),
      data,
    })
    log.silly(PRE, `sendFile() : ${JSON.stringify(res)}`)
    return RequestStatus.Success
  }

  // send mini program
  /* public sendMiniProgram = async (miniProgram: MiniProgram) => {
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
