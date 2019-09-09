/* eslint camelcase: 0 */
import { log } from '../config'
import { PadplusMessageSource } from '../schemas'
import { xmlToJson } from './xml-to-json'

const PRE = 'messageSourceParser'

export async function messageSourceParser (messageSource: string): Promise<PadplusMessageSource | null> {
  if (messageSource === '') {
    return null
  }

  interface XmlSchema {
    msgsource: {
      silence?: string,
      membercount?: string,
      img_file_name?: string,
      atuserlist?: string,
    }
  }

  const tryXmlText = `<?xml version="1.0"?>\n${messageSource}`.replace(/^[^\n]+\n/, '')

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)
    const data = jsonPayload.msgsource
    const result: PadplusMessageSource = {}

    if (data.silence) {
      result.silence = data.silence === '1'
    }
    if (data.membercount) {
      result.memberCount = parseInt(data.membercount, 10)
    }
    if (data.img_file_name) {
      result.imageFileName = data.img_file_name
    }
    if (data.atuserlist) {
      result.atUserList = data.atuserlist.split(',')
    }

    return result
  } catch (e) {
    log.verbose(PRE, `parse message source failed, failed message source is: ${messageSource}`)
    return null
  }
}
