import { log } from '../../config'
import { GrpcCreateRoomData, GrpcGetAnnouncementData, GrpcSetAnnouncementData } from '../../schemas'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb'

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

}
