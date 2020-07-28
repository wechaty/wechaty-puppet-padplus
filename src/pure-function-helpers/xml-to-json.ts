import { parseString } from 'xml2js'
import { log } from '../config'
export async function xmlToJson (xml: string): Promise<any> {
  return new Promise((resolve) => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        log.warn(JSON.stringify(err))
      }
      return resolve(result)
    })
  })
}
