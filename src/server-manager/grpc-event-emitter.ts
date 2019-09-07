import { EventEmitter } from 'events';

export class GrpcEventEmitter extends EventEmitter {

  private name: string
  private userName: string
  private uin: number
  private qrcodeId: number

  constructor(name: string) {
    super()
    this.name = name
    this.userName = ''
    this.uin = 0
    this.qrcodeId = 0
  }

  public setUserName (userName: string) {
    this.userName = userName
  }

  public setUIN (uin: number) {
    this.uin = uin
  }

  public setQrcodeId (qrcodeId: number) {
    this.qrcodeId = qrcodeId
  }

  public getUserName () {
    return this.userName
  }

  public getUIN () {
    return this.uin
  }

  public getQrcodeId () {
    return this.qrcodeId
  }

}
