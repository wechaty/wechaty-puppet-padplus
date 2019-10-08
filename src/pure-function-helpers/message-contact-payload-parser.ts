import { xmlToJson } from './xml-to-json'

import {
  PadplusContactMessagePayload,
  PadplusMessagePayload,
}                       from '../schemas'

import { log } from '../config'

import { isPayload } from './is-type'

export async function contactMessageParser (rawPayload: PadplusMessagePayload): Promise<PadplusContactMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const content = rawPayload.content.trim()

  interface XmlSchema {
    msg: {
      $: {
        bigheadimgurl: string,
        smallheadimgurl: string,
        username: string,
        nickname: string,
        fullpy: string,
        shortpy: string,
        alias: string,
        imagestatus: number,
        scene: number,
        province: string,
        city: string,
        sign: string,
        sex: number,
        certflag: number,
        regionCode: string,
      },
    },
    createTime: number,
    fromUserName: number,
    imgBuf: string,
    imgStatus: number,
    l1MsgType: number,
    msgId: string,
    msgSource: string,
    msgSourceCd: string,
    msgType: number,
    newMsgId: number,
    pushContent: string,
    status: number,
    toUserName: string,
    uin: string,
    wechatyUserName: string,
  }
  let tryXmlText = content
  if (!/^<msg>.*/.test(content)) {
    tryXmlText = content.replace(/^[^\n]+\n/, '')
  }

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const {
      bigheadimgurl,
      smallheadimgurl,
      username,
      nickname,
    } = jsonPayload.msg.$
    log.silly(`jsonPayload : ${JSON.stringify(jsonPayload.msg)}`)

    return {
      bigheadimgurl,
      nickname,
      smallheadimgurl,
      username,
    }
  } catch (e) {
    log.verbose(e.stack)
    return null
  }
}
