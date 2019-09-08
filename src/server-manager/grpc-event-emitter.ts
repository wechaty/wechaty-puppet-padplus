import { EventEmitter } from 'events'

export class GrpcEventEmitter extends EventEmitter {

  private name: string
  private userName: string
  private uin: string
  private qrcodeId: string

  constructor (name: string) {
    super()
    this.name = name
    this.userName = ''
    this.uin = ''
    this.qrcodeId = ''
  }

  public setUserName (userName: string) {
    this.userName = userName
  }

  public setUIN (uin: string) {
    this.uin = uin
  }

  public setQrcodeId (qrcodeId: string) {
    this.qrcodeId = qrcodeId
  }

  public getUserName () {
    return this.userName
  }

  public getUIN () {
    return this.uin
  }

  public getName () {
    return this.name
  }

  public getQrcodeId () {
    return this.qrcodeId
  }

}
