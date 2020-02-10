import { log } from '../../config'
import { RequestClient } from './request'
import { ApiType, StreamResponse } from '../../server-manager/proto-ts/PadPlusServer_pb'
import { PadplusMessageType, PadplusRichMediaData, GrpcResponseMessageData, PadplusRecallData } from '../../schemas'
import { WechatAppMessageType } from 'wechaty-puppet/dist/src/schemas/message'

const PRE = 'PadplusMessage'

export class PadplusMessage {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // Send message (text, image, url, video, file, gif)
  public async sendMessage (
    selfId: string,
    receiverId: string,
    content: string,
    messageType: PadplusMessageType,
    mentionListStr?: string,
  ): Promise<GrpcResponseMessageData> {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: content,
      fromUserName: selfId,
      mentionListStr,
      messageType,
      toUserName: receiverId,
    }

    try {
      const result = await this.requestClient.request({
        apiType: ApiType.SEND_MESSAGE,
        data,
      })

      if (result) {
        const msgDataStr = result.getData()
        if (msgDataStr) {
          const msgData: GrpcResponseMessageData = JSON.parse(msgDataStr)
          return msgData
        } else {
          throw new Error(`can not parse message data from grpc`)
        }
      } else {
        throw new Error(`can not get response from grpc server`)
      }
    } catch (e) {
      throw new Error(`can not send message due to this error: ${e}`)
    }

  }

  // Send url link
  public sendUrlLink = async (selfId: string, receiverId: string, content: string): Promise<GrpcResponseMessageData> => {
    log.verbose(PRE, `sendUrlLink()`)

    return this.sendMessage(selfId, receiverId, content, PadplusMessageType.App)
  }

  // send voice
  public sendVoice = async (selfId: string, receiver: string, url: string, fileSize: string): Promise<GrpcResponseMessageData> => {
    log.verbose(PRE, `sendVoice()`)

    const data = {
      fileSize,
      fromUserName: selfId,
      messageType: PadplusMessageType.Voice,
      toUserName: receiver,
      url,
    }

    try {
      const result = await this.requestClient.request({
        apiType: ApiType.SEND_MESSAGE,
        data,
      })

      if (result) {
        const msgDataStr = result.getData()
        if (msgDataStr) {
          const msgData: GrpcResponseMessageData = JSON.parse(msgDataStr)
          return msgData
        } else {
          throw new Error(`the message response data is empty, params: ${JSON.stringify(data)}`)
        }
      } else {
        throw new Error(`can not get response from grpc server`)
      }
    } catch (e) {
      throw new Error(`can not send message due to this error: ${e}`)
    }
  }

  // send contact card
  public sendContact = async (selfId: string, receiver: string, content: string): Promise<GrpcResponseMessageData> => {
    log.verbose(PRE, `sendContact()`)

    return this.sendMessage(selfId, receiver, content, PadplusMessageType.ShareCard)
  }

  public sendFile = async (
    selfId: string,
    receiver: string,
    url: string,
    fileName: string,
    subType: string,
    fileSize?: number,
  ): Promise<GrpcResponseMessageData> => {
    log.verbose(PRE, `sendFile()`)
    let data = {}
    if (subType === 'doc') {
      const content = {
        des: fileName,
        fileSize,
        thumburl: '',
        title: fileName,
        url,
      }
      data = {
        appMsgType: WechatAppMessageType.Attach,
        content: JSON.stringify(content),
        fileName,
        fromUserName: selfId,
        messageType: PadplusMessageType.App,
        subType,
        toUserName: receiver,
        url,
      }
      const result = await this.requestClient.request({
        apiType: ApiType.SEND_MESSAGE,
        data,
      })
      if (result) {
        const msgDataStr = result.getData()
        if (msgDataStr) {
          const msgData: GrpcResponseMessageData = JSON.parse(msgDataStr)
          return msgData
        } else {
          throw new Error(`can not parse message data from grpc`)
        }
      } else {
        throw new Error(`can not get callback result of SEND_FILE, subType : ${subType}`)
      }
    }
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
      data = {
        content: JSON.stringify(content),
        fileName,
        fromUserName: selfId,
        messageType: PadplusMessageType.App,
        subType: 'doc',
        toUserName: receiver,
        url,
      }
    }
    const res = await this.requestClient.request({
      apiType: ApiType.SEND_FILE,
      data,
    })
    if (res) {
      const msgDataStr = res.getData()
      if (msgDataStr) {
        const msgData: GrpcResponseMessageData = JSON.parse(msgDataStr)
        return msgData
      } else {
        throw new Error(`can not parse message data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of SEND_FILE, subType : ${subType}`)
    }
  }

  public async loadRichMeidaData (mediaData: PadplusRichMediaData): Promise<StreamResponse> {
    log.silly(PRE, `loadRichMeidaData()`)

    const response = await this.requestClient.request({
      apiType: ApiType.GET_MESSAGE_MEDIA,
      data: mediaData,
    })

    if (response) {
      return response
    } else {
      throw new Error(`can not get callback result of GET_MESSAGE_MEDIA`)
    }
  }

  public async recallMessage (selfId: string, receiverId: string, messageId: string): Promise<boolean> {
    log.verbose(PRE, `recallMessage`)
    const data = {
      fromUserName: selfId,
      msgId: messageId,
      toUserName: receiverId,
    }

    const res = await this.requestClient.request({
      apiType: ApiType.REVOKE_MESSAGE,
      data,
    })

    if (res) {
      const msgDataStr = res.getData()
      if (msgDataStr) {
        const msgData: PadplusRecallData = JSON.parse(msgDataStr)
        return msgData.BaseResponse.Ret === 0 && msgData.BaseResponse.ErrMsg === '已撤回'
      } else {
        log.error(`can not parse message data from grpc`)
      }
    } else {
      log.error(`can not get response from grpc server`)
    }

    return false
  }

}
