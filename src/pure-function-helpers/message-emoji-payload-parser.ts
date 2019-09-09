import { PadplusEmojiMessagePayload, PadplusMessagePayload } from '../schemas'
import { isPayload } from './is-type'
import { xmlToJson } from './xml-to-json'

export async function emojiPayloadParser (rawPayload: PadplusMessagePayload): Promise<PadplusEmojiMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  // {
  //   "msg": {
  //     "emoji": {
  //       "$": {
  //         "fromusername": "lylezhuifeng",
  //         "tousername": "wxid_rdwh63c150bm12",
  //         "type": "2",
  //         "idbuffer": "media:0_0",
  //         "md5": "8dae79800b6ef10195e126042fc94076",
  //         "len": "310090",
  //         "productid": "",
  //         "androidmd5": "8dae79800b6ef10195e126042fc94076",
  //         "androidlen": "310090",
  //         "s60v3md5": "8dae79800b6ef10195e126042fc94076",
  //         "s60v3len": "310090",
  //         "s60v5md5": "8dae79800b6ef10195e126042fc94076",
  //         "s60v5len": "310090",
  //         "cdnurl": "http://emoji.qpic.cn/wx_emoji/l4keeCADqvmX5rSCy4nHXib3IpnTLy2T6CXetFgclb3ICM8zFs2wjNQ/",
  //         "designerid": "",
  //         "thumburl": "",
  //         "encrypturl": "http://emoji.qpic.cn/wx_emoji/b1Nsib7KBEDmYQq4bzAFibrXjUehx9MhaK2GgYMLcFeerjLd7jic3aLibQ/",
  //         "aeskey": "54a31301a1a2fb1a36ca35b741473d6f",
  //         "externurl": "http://emoji.qpic.cn/wx_emoji/CEnicDu2nX21RqMM5FdUtC6dAibroWDIdae0FeNAznUhEXQf7MKjtQQcet3Uqjl1Dy/",
  //         "externmd5": "128bdfe8c926db33f6adc62b955904a2",
  //         "width": "135",
  //         "height": "180",
  //         "tpurl": "",
  //         "tpauthkey": "",
  //         "attachedtext": ""
  //       }
  //     },
  //     "gameext": {
  //       "$": {
  //         "type": "0",
  //         "content": "0"
  //       }
  //     }
  //   }
  // }

  const { content } = rawPayload

  interface XmlSchema {
    msg: {
      emoji: {
        $: {
          type  : string,
          len   : string,
          cdnurl: string,
          width : string,
          height: string,
        }
      }
    }
  }

  const tryXmlText = content.replace(/^[^\n]+\n/, '')

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const type = parseInt(jsonPayload.msg.emoji.$.type, 10) || 0
    const len = parseInt(jsonPayload.msg.emoji.$.len, 10) || 0
    const width = parseInt(jsonPayload.msg.emoji.$.width, 10) || 0
    const height = parseInt(jsonPayload.msg.emoji.$.height, 10) || 0
    const cdnurl = jsonPayload.msg.emoji.$.cdnurl

    return {
      cdnurl,
      height,
      len,
      type,
      width,
    }
  } catch (e) {
    return null
  }
}
