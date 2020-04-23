import { MiniProgramPayload } from 'wechaty-puppet'
import { xmlToJson } from './xml-to-json'

import {
  PadplusMessagePayload,
}                       from '../schemas'

import { log } from '../config'

import { isPayload } from './is-type'

export async function miniProgramMessageParser (rawPayload: PadplusMessagePayload): Promise<MiniProgramPayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const content = rawPayload.content.trim()

  interface XmlSchema {
    msg: {
      appmsg: {
        title: string,
        des: string,
        appattach: {
          cdnthumbaeskey: string,
          cdnthumburl: string,
        },
        weappinfo: {
          username: string,
          appid: string,
          pagepath: string,
        },
        thumburl: string,
        md5: any,
      },
      fromusername: string,
    }
  }
  let tryXmlText = content
  if (!/^<msg>.*/.test(content)) {
    tryXmlText = content.replace(/^[^\n]+\n/, '')
  }

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const { title, des } = jsonPayload.msg.appmsg
    const { username, appid, pagepath } = jsonPayload.msg.appmsg.weappinfo
    const { cdnthumburl, cdnthumbaeskey } = jsonPayload.msg.appmsg.appattach
    return {
      appid,
      description: des,
      pagePath: pagepath,
      thumbKey: cdnthumbaeskey,
      thumbUrl: cdnthumburl,
      title,
      username,
    }
  } catch (e) {
    log.verbose(e.stack)
    return null
  }
}
