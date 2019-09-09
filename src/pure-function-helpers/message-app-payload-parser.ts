import { xmlToJson } from './xml-to-json'

import {
  PadplusAppAttachPayload,
  PadplusAppMessagePayload,
  PadplusMessagePayload,
}                       from '../schemas'

import { log } from '../config'

import { isPayload } from './is-type'

export async function appMessageParser (rawPayload: PadplusMessagePayload): Promise<PadplusAppMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const content = rawPayload.content.trim()

  interface XmlSchema {
    msg: {
      appmsg: {
        title: string,
        des: string,
        type: string,
        url: string,
        appattach: {
          totallen: string,
          attachid: string,
          emoticonmd5: string,
          fileext: string,
          cdnattachurl: string,
          cdnthumbaeskey: string,
          aeskey: string,
          encryver: string,
          islargefilemsg: string,
        },
        thumburl: string,
        md5: any,
        recorditem?: string
      },
      fromusername: string,
      appinfo: {
        appname: any
      }
    }
  }
  let tryXmlText = content
  if (!/^<msg>.*/.test(content)) {
    tryXmlText = content.replace(/^[^\n]+\n/, '')
  }

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const { title, des, url, thumburl, type, md5, recorditem } = jsonPayload.msg.appmsg
    let appattach: PadplusAppAttachPayload | undefined
    const tmp = jsonPayload.msg.appmsg.appattach
    if (tmp) {
      appattach = {
        aeskey        : tmp.aeskey,
        attachid      : tmp.attachid,
        cdnattachurl  : tmp.cdnattachurl,
        cdnthumbaeskey: tmp.cdnthumbaeskey,
        emoticonmd5   : tmp.emoticonmd5,
        encryver      : (tmp.encryver && parseInt(tmp.encryver, 10)) || 0,
        fileext       : tmp.fileext,
        islargefilemsg: (tmp.islargefilemsg && parseInt(tmp.islargefilemsg, 10)) || 0,
        totallen      : (tmp.totallen && parseInt(tmp.totallen, 10)) || 0,
      }
    }
    return {
      appattach,
      des,
      md5,
      recorditem,
      thumburl,
      title,
      type: parseInt(type, 10),
      url,
    }
  } catch (e) {
    log.verbose(e.stack)
    return null
  }
}
