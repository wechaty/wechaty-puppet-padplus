import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType, StreamResponse } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { PadplusMessageType, RequestStatus, PadplusRichMediaData } from '../../schemas'

const PRE = 'PadplusMessage'

export class PadplusMessage {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
    log.silly(PRE, `re : ${this.requestClient}`)
  }

  // Send message (text, image, url, video, file, gif)
  public async sendMessage (
    selfId: string,
    receiverId: string,
    content: string,
    messageType: PadplusMessageType,
    mentionListStr?: string,
  ): Promise<boolean | null> {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: content,
      fromUserName: selfId,
      mentionListStr,
      messageType,
      toUserName: receiverId,
    }

    try {
      const res = await this.requestClient.request({
        apiType: ApiType.SEND_MESSAGE,
        data,
      })
      // TODO: read send result from the response, and generate message
      log.silly(PRE, `sendMessage : ${JSON.stringify(res)}`)
      return true
    } catch (e) {
      return null
    }

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
    let data = {}
    if (subType === 'pic') {
      data = {
        fileName,
        fromUserName: selfId,
        messageType: PadplusMessageType.Image,
        subType,
        toUserName: receiver,
        url,
      }
    } else if (subType === 'video') {
      const content = {
        des: fileName,
        thumburl: '',
        title: fileName,
        type: 5,
        url,
      }
      // TODO: waiting for new API for send video
      data = {
        content: JSON.stringify(content),
        fileName,
        fromUserName: selfId,
        messageType: PadplusMessageType.App,
        subType: 'doc',
        toUserName: receiver,
        url,
      }
    } else if (subType === 'doc') {
      const content = {
        des: fileName,
        thumburl: '',
        title: fileName,
        type: 5,
        url,
      }
      data = {
        content: JSON.stringify(content),
        fileName,
        fromUserName: selfId,
        messageType: PadplusMessageType.App,
        subType,
        toUserName: receiver,
        url,
      }
    }

    const res = await this.requestClient.request({
      apiType: ApiType.SEND_FILE,
      data,
    })
    log.silly(PRE, `sendFile() : ${JSON.stringify(res)}`)
    return RequestStatus.Success
  }

  public async loadRichMeidaData (mediaData: PadplusRichMediaData): Promise<StreamResponse> {
    log.silly(PRE, `loadRichMeidaData()`)

    const res = await this.requestClient.request({
      apiType: ApiType.GET_MESSAGE_MEDIA,
      data: mediaData,
    })
    log.silly(PRE, `loadRichMeidaData() : ${JSON.stringify(res)}`)
    if (res) {
      return res
    } else {
      throw new Error(`can not load rich media data.`)
    }
  }

}
