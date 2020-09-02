import { PadplusMessagePayload, REFER_MSG_TYPE } from '../schemas'
import { xmlToJson } from './xml-to-json'
import { log } from 'brolog'

function referMsgDic (type: string) {
  switch (type) {
    case REFER_MSG_TYPE.TEXT:
      return '文本消息'
    case REFER_MSG_TYPE.IMAGE:
      return '图片消息'
    case REFER_MSG_TYPE.VIDEO:
      return '视频消息'
    case REFER_MSG_TYPE.LOCATION:
      return '定位消息'
    case REFER_MSG_TYPE.LINK:
      return '链接/文件消息'
    default:
      return '未知类型消息'
  }
}

export async function quotePayloadParser (rawPayload: PadplusMessagePayload): Promise<string> {
  const { content } = rawPayload

  interface XmlSchema {
    msg: {
      appmsg: {
        title: string,
        refermsg: {
          type: string,
          svrid: string,
          fromusr: string,
          chatusr: string,
          displayname: string,
          content: string,
          msgsource: string,
        }
      }
    }
  }

  const tryXmlText = content.replace(/^[^\n]+\n/, '')

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    if (!jsonPayload || !jsonPayload.msg || !jsonPayload.msg.appmsg || !jsonPayload.msg.appmsg.refermsg) {
      log.error(`can not get detail info about quote message, ${JSON.stringify(jsonPayload)}`)
      return referMsgDic('')
    }

    const { title, refermsg } = jsonPayload.msg.appmsg
    const { type, displayname, content } = refermsg
    const splitLine = '\n- - - - - - - - - - - - - - -\n'
    const refContent = type === REFER_MSG_TYPE.TEXT ? content : referMsgDic(type)

    const preText = `"${displayname}:\n${refContent}"${splitLine}`

    return preText + title
  } catch (e) {
    throw new Error(`can not parse xml to json: ${JSON.stringify(tryXmlText)}`)
  }
}
