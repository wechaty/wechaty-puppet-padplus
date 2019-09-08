import { log } from '../../config'
import { RequestStatus, GrpcRoomRawPayload } from '../../schemas'
import { RequestClient } from './request'
import { ApiType } from '../../server-manager/proto-ts/PadPlusServer_pb';

const PRE = 'PadplusRoom'

export class PadplusRoom {

  private requestClient: RequestClient
  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // 修改微信群名称
  public setTopic = async (loginId: string, roomId: string, topic: string): Promise<RequestStatus> => {
    log.verbose(PRE, `setTopic(${loginId}, ${roomId}, ${topic})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
      name: topic,
    }

    const res = await this.requestClient.request({
      apiType: ApiType.CHANGE_TOPIC,
      data,
    })
    log.silly(PRE, `message : ${JSON.stringify(res)}`)
    return RequestStatus.Success
  }

  public getRoomMembers = async (uin: string, roomId: string): Promise<GrpcRoomRawPayload> => {
    log.verbose(PRE, `getRoomMembers(${uin}, ${roomId})`)

    const data = {
    }

    const res = await this.requestClient.request({
      apiType: ApiType.GET_ROOM_MEMBER,
      data,
    })
    const json = res.getData()
    if (!json) {
      // return null
    }
    log.verbose(PRE, `getRoomMembers return ${json}`)
    const rawRoom: GrpcRoomRawPayload = JSON.parse(json!)
    return rawRoom
  }

  // 获取微信群列表
  public setAnnouncement = async (loginId: string, roomId: string, announcement: string): Promise<RequestStatus> => {
    log.verbose(PRE, `setAnnouncement(${loginId}, ${roomId},${announcement})`)

    const data = {
    }

    await this.requestClient.request({
      apiType: ApiType.CHANGE_TOPIC,
      data,
    })
    return RequestStatus.Success
  }

  // // 获取微信群成员列表
  // public roomMember = async (loginId: string, roomId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomMember(${loginId}, ${roomId})`)

  //   const data = {
  //     my_account: loginId,
  //     number: roomId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'getRoomMemberList',
  //     data,
  //   })
  //   log.silly(PRE, `message : ${JSON.stringify(res)}`)
  //   if (res.code === RequestStatus.Success) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomDetailInfo = async (loginId: string, roomId: string): Promise<GrpcRoomDetailInfo> => {
  //   log.verbose(PRE, `roomDetailInfo(${loginId}, ${roomId})`)

  //   const data = {
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res: GrpcRoomDetailInfo = await this.requestClient.request({
  //     apiName: 'getRoomDetailInfo',
  //     data,
  //   })
  //   return res
  // }

  // public createRoom = async (loginId: string, contactIdList: string[], topic?: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `createRoom(${loginId}, ${contactIdList}, ${topic})`)

  //   const data = {
  //     account: contactIdList.toString(),
  //     group_number: topic,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'createRoom',
  //     data,
  //   })
  //   log.silly(PRE, `createRoom res : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomOwner = async (loginId: string, roomId: string): Promise<any> => {
  //   log.verbose(PRE, `roomOwner(${loginId}, ${roomId})`)

  //   const data = {
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'getRoomOwner',
  //     data,
  //   })

  //   return res
  // }

  // public roomAdd = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomAdd(${loginId}, ${roomId}, ${contactId})`)

  //   const data = {
  //     account: contactId,
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'addMemberToRoom',
  //     data,
  //   })
  //   log.silly(PRE, `roomAdd message : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomInvite = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomAdd(${loginId}, ${roomId}, ${contactId})`)

  //   const data = {
  //     account: contactId,
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'inviteFriendToRoomMoreThanForty',
  //     data,
  //   })
  //   log.silly(PRE, `roomInvite message : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomDel = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomDel(${loginId}, ${roomId}, ${contactId})`)

  //   const data = {
  //     account: contactId,
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'removeMemberFromRoom',
  //     data,
  //   })
  //   log.silly(PRE, `roomDel message : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomQuit = async (loginId: string, roomId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomQuit(${loginId}, ${roomId})`)

  //   const data = {
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'leaveRoom',
  //     data,
  //   })
  //   log.silly(PRE, `roomQuit message : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public roomQrcode = async (loginId: string, roomId: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `roomQrcode(${loginId}, ${roomId})`)

  //   const data = {
  //     g_number: roomId,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'getRoomQRCode',
  //     data,
  //   })
  //   log.silly(PRE, `roomQrcode message : ${JSON.stringify(res)}`)
  //   if (res) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

  // public atRoomMember = async (loginId: string, roomId: string, atUser: string, content: string): Promise<RequestStatus> => {
  //   log.verbose(PRE, `atRoomMember(${loginId}, ${roomId}, ${atUser}, ${content})`)

  //   const data = {
  //     account: roomId,
  //     atUser,
  //     content,
  //     my_account: loginId,
  //   }

  //   const res = await this.requestClient.request({
  //     apiName: 'atRoomMember',
  //     data,
  //   })
  //   log.silly(PRE, `message : ${JSON.stringify(res)}`)
  //   if (res.code === RequestStatus.Success) {
  //     return RequestStatus.Success
  //   } else {
  //     return RequestStatus.Fail
  //   }
  // }

}
