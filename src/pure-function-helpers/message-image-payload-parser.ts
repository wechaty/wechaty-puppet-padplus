import { PadplusImageMessagePayload, PadplusMessagePayload } from '../schemas'
import { isPayload } from './is-type'
import { xmlToJson } from './xml-to-json'

export async function imagePayloadParser (rawPayload: PadplusMessagePayload): Promise<PadplusImageMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const { content } = rawPayload
  // {
  //   "msg": {
  //     "img": {
  //       "$": {
  //         "aeskey": "cba5766c0515a49a5a0f9d988d1d8a79",
  //         "encryver": "1",
  //         "cdnthumbaeskey": "cba5766c0515a49a5a0f9d988d1d8a79",
  //         "cdnthumburl": "304e020100044730450201000204d8e50c6e02033d0af80204b830feb602045bf3b3df0420777869645f65326c633333617575363167323238385f313534323639373934390204010400010201000400",
  //         "cdnthumblength": "24131",
  //         "cdnthumbheight": "120",
  //         "cdnthumbwidth": "90",
  //         "cdnmidheight": "0",
  //         "cdnmidwidth": "0",
  //         "cdnhdheight": "0",
  //         "cdnhdwidth": "0",
  //         "cdnmidimgurl": "304e020100044730450201000204d8e50c6e02033d0af80204b830feb602045bf3b3df0420777869645f65326c633333617575363167323238385f313534323639373934390204010400010201000400",
  //         "length": "497863",
  //         "cdnbigimgurl": "304e020100044730450201000204d8e50c6e02033d0af80204b830feb602045bf3b3df0420777869645f65326c633333617575363167323238385f313534323639373934390204010400010201000400",
  //         "hdlength": "2729348",
  //         "md5": "d908713540f845d517f11cdf60def4a3"
  //       }
  //     }
  //   }
  // }
  interface XmlSchema {
    msg: {
      img: {
        $: {
          aeskey: string,
          encryver: string,
          cdnthumbaeskey: string,
          cdnthumburl: string,
          cdnthumblength: string,
          cdnthumbheight: string,
          cdnthumbwidth: string,
          cdnmidheight: string,
          cdnmidwidth: string,
          cdnhdheight: string,
          cdnhdwidth: string,
          cdnmidimgurl: string,
          length: string,
          cdnbigimgurl?: string,
          hdlength?: string,
          md5: string,
        }
      }
    }
  }

  const tryXmlText = content.replace(/^[^\n]+\n/, '')

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const result: PadplusImageMessagePayload = {
      aesKey        : jsonPayload.msg.img.$.aeskey,
      cdnHdHeight   : parseInt(jsonPayload.msg.img.$.cdnhdheight, 10),
      cdnHdWidth    : parseInt(jsonPayload.msg.img.$.cdnhdwidth, 10),
      cdnMidHeight  : parseInt(jsonPayload.msg.img.$.cdnmidheight, 10),
      cdnMidImgUrl  : jsonPayload.msg.img.$.cdnmidimgurl,
      cdnMidWidth   : parseInt(jsonPayload.msg.img.$.cdnmidwidth, 10),
      cdnThumbAesKey: jsonPayload.msg.img.$.cdnthumbaeskey,
      cdnThumbHeight: parseInt(jsonPayload.msg.img.$.cdnthumbheight, 10),
      cdnThumbLength: parseInt(jsonPayload.msg.img.$.cdnthumblength, 10),
      cdnThumbUrl   : jsonPayload.msg.img.$.cdnthumburl,
      cdnThumbWidth : parseInt(jsonPayload.msg.img.$.cdnthumbwidth, 10),
      encryVer      : parseInt(jsonPayload.msg.img.$.encryver, 10),
      length        : parseInt(jsonPayload.msg.img.$.length, 10),
      md5           : jsonPayload.msg.img.$.md5,
    }
    const hdLength = jsonPayload.msg.img.$.hdlength
    const cdnBigImgUrl = jsonPayload.msg.img.$.cdnbigimgurl
    if (hdLength) {
      result.hdLength = parseInt(hdLength, 10)
    }
    if (cdnBigImgUrl) {
      result.cdnBigImgUrl = cdnBigImgUrl
    }

    return result
  } catch (e) {
    return null
  }
}
