import { log } from '../../config'
import { GrpcCreateRoomData, GrpcGetAnnouncementData, GrpcSetAnnouncementData, GrpcAccpetRoomInvitation } from '../../schemas'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'
import axios from 'axios'

const PRE = 'PadplusRoom'

export class PadplusRoom {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // 修改微信群名称
  public setTopic = async (roomId: string, topic: string): Promise<void> => {
    log.verbose(PRE, `setTopic(${roomId}, ${topic})`)
    const OpType = 'UPDATE'
    const type = 'MOD_TOPIC'
    const data = {
      OpType,
      content: topic,
      roomId,
      type,
    }

    await this.requestClient.request({
      apiType: ApiType.ROOM_OPERATION,
      data,
    })
  }

  public getRoomInfo = async (roomId: string): Promise<boolean> => {
    log.verbose(PRE, `getRoomInfo(${roomId})`)

    const data = {
      userName: roomId,
    }
    await this.requestClient.request({
      apiType: ApiType.GET_CONTACT,
      data,
    })
    return true
  }

  public async deleteRoomMember (roomId: string, contactId: string) {
    log.verbose(PRE, `deleteRoomMember(${roomId}, ${contactId})`)

    const OpType = 'UPDATE'
    const type = 'DEL_MEMBER'
    const data = {
      OpType,
      content: contactId,
      roomId,
      type,
    }

    await this.requestClient.request({
      apiType: ApiType.ROOM_OPERATION,
      data,
    })
  }

  public getRoomMembers = async (uin: string, roomId: string): Promise<void> => {
    log.verbose(PRE, `getRoomMembers(${uin}, ${roomId})`)

    const OpType = 'UPDATE'
    const type = 'GET_MEMBER'
    const data = {
      OpType,
      content: '',
      roomId,
      type,
    }

    await this.requestClient.request({
      apiType: ApiType.ROOM_OPERATION,
      data,
    })
  }

  public getRoomQrcode = async (roomId: string): Promise<string> => {
    log.verbose(PRE, `getRoomQrcode(${roomId})`)

    const data = {
      roomId,
    }

    const result = await this.requestClient.request({
      apiType: ApiType.GET_ROOM_QRCODE,
      data,
    })

    if (result) {
      const roomQrcodeDataStr = result.getData()
      if (roomQrcodeDataStr) {
        const roomQrcodeData = JSON.parse(roomQrcodeDataStr)
        return roomQrcodeData.qrcodeBuf
      } else {
        throw new Error(`can not parse room qrcode data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of GET_ROOM_QRCODE`)
    }
  }

  public setAnnouncement = async (roomId: string, announcement: string): Promise<string> => {
    log.verbose(PRE, `setAnnouncement(${roomId},${announcement})`)

    const data = {
      announcement,
      wxid: roomId,
    }

    const result = await this.requestClient.request({
      apiType: ApiType.SET_ROOM_ANNOUNCEMENT,
      data,
    })
    if (result) {
      const announcementDataStr = result.getData()
      if (announcementDataStr) {
        const announcementData: GrpcSetAnnouncementData = JSON.parse(announcementDataStr)
        if (announcementData.status !== 0) { // status: -2025 '仅群主可编辑群公告。'
          throw new Error(`set announcement failed.`)
        }
        return announcementData.content
      } else {
        throw new Error(`can not parse announcement data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of SET_ROOM_ANNOUNCEMENT`)
    }
  }

  public getAnnouncement = async (roomId: string): Promise<string> => {
    log.verbose(PRE, `setAnnouncement(${roomId})`)

    const data = {
      wxid: roomId,
    }

    const result = await this.requestClient.request({
      apiType: ApiType.GET_ROOM_ANNOUNCEMENT,
      data,
    })
    if (result) {
      const announcementDataStr = result.getData()
      if (announcementDataStr) {
        const announcementData: GrpcGetAnnouncementData = JSON.parse(announcementDataStr)
        return announcementData.announcement
      } else {
        throw new Error(`can not parse announcement data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of GET_ROOM_ANNOUNCEMENT`)
    }
  }

  public addMember = async (roomId: string, memberId: string): Promise<void> => {
    log.verbose(PRE, `addMember(${roomId},${memberId})`)
    const data = {
      OpType: 'UPDATE',
      content: memberId,
      roomId,
      type: 'ADD_MEMBER',
    }

    await this.requestClient.request({
      apiType: ApiType.ROOM_OPERATION,
      data,
    })
  }

  public createRoom = async (topic: string, memberIdList: string[]): Promise<string> => {
    log.verbose(PRE, `createRoom(${topic},memberIds${memberIdList.join(',')})`)
    const data = {
      memberList: memberIdList,
      topic,
    }

    const result = await this.requestClient.request({
      apiType: ApiType.CREATE_ROOM,
      data,
    })

    if (result) {
      const roomDataStr = result.getData()

      if (roomDataStr) {
        const roomData: GrpcCreateRoomData = JSON.parse(roomDataStr)
        if (roomData.roomId) {
          return roomData.roomId
        } else {
          throw new Error(`can not create room by member: ${JSON.stringify(roomData.createMessage)}`)
        }
      } else {
        throw new Error(`can not parse room data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of CREATE_ROOM`)
    }
  }

  public quitRoom = async (roomId: string): Promise<void> => {
    log.verbose(PRE, `quitRoom(${roomId})`)
    const data = {
      OpType: 'UPDATE',
      roomId,
      type: 'DEL_CHAT_ROOM',
    }

    await this.requestClient.request({
      apiType: ApiType.ROOM_OPERATION,
      data,
    })
  }

  public async getRoomInvitationDetail (inviteUrl: string, inviteFrom: string): Promise<void> {
    log.verbose(PRE, `getRoomInvitationDetail(${inviteUrl}, ${inviteFrom})`)
    const data = {
      inviteFrom,
      inviteUrl,
      type: 'GET_INVITE_INFO',
    }

    const result = await this.requestClient.request({
      apiType: ApiType.ACCEPT_ROOM_INVITATION,
      data,
    })

    if (result) {
      const roomDataStr = result.getData()

      if (roomDataStr) {
        const grpcAccpetRoomInvitation: GrpcAccpetRoomInvitation = JSON.parse(roomDataStr)
        if (grpcAccpetRoomInvitation && grpcAccpetRoomInvitation.inviteDetailUrl) {
          let body
          try {
            body = await axios.post(grpcAccpetRoomInvitation.inviteDetailUrl)
          } catch (error) {
            // no need to care about this error
          }
          if (body && body.data) {
            const res = body.data
            if (res.indexOf('你无法查看被转发过的邀请') !== -1 || res.indexOf('Unable to view forwarded invitations') !== -1) {
              throw new Error('FORWARDED: Accept invitation failed, this is a forwarded invitation, can not be accepted')
            } else if (res.indexOf('你未开通微信支付') !== -1 || res.indexOf('You haven\'t enabled WeChat Pay') !== -1
                      || res.indexOf('你需要实名验证后才能接受邀请') !== -1) {
              throw new Error('WXPAY: The user need to enable wechaty pay(微信支付) to join the room, this is requested by Wechat.')
            } else if (res.indexOf('该邀请已过期') !== -1 || res.indexOf('Invitation expired') !== -1) {
              throw new Error('EXPIRED: The invitation is expired, please request the user to send again')
            } else if (res.indexOf('群聊邀请操作太频繁请稍后再试') !== -1 || res.indexOf('操作太频繁，请稍后再试') !== -1) {
              throw new Error('FREQUENT: Room invitation operation too frequent.')
            } else if (res.indexOf('已达群聊人数上限') !== -1) {
              throw new Error('LIMIT: The room member count has reached the limit.')
            } else if (res.indexOf('该群因违规已被限制使用，无法添加群成员') !== -1) {
              throw new Error('INVALID: This room has been mal used, can not add new members.')
            }
          }
        } else {
          throw new Error(`can not parse room invitation data: ${JSON.stringify(grpcAccpetRoomInvitation)}`)
        }
      } else {
        throw new Error(`can not parse room data from grpc`)
      }
    } else {
      throw new Error(`can not get callback result of GET_INVITE_INFO`)
    }
  }

}
