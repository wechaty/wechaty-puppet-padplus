import { PadplusMessagePayload, PadplusRecalledMessagePayload } from '../schemas'
import { isPayload, isRoomId } from './is-type'
import { xmlToJson } from './xml-to-json'

export async function recalledPayloadParser (
  rawPayload: PadplusMessagePayload
): Promise<PadplusRecalledMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  let text: string
  if (isRoomId(rawPayload.fromUserName)) {

    const startIndex = rawPayload.content.indexOf(':\n')

    text = rawPayload.content.slice(startIndex !== -1 ? startIndex + 2 : 0)

  } else {

    text = rawPayload.content

  }

  // {
  //   "sysmsg": {
  //     "$": {
  //       "type": "revokemsg"
  //     },
  //     "revokemsg": {
  //       "session": "12511063195@chatroom",
  //       "msgid": "1684265107",
  //       "newmsgid": "4275856478804543592",
  //       "replacemsg": "\"高原ོ\" 撤回了一条消息"
  //     }
  //   }
  // }

  interface XmlSchema {
    sysmsg: {
      $: {
        type: string
      },
      revokemsg: {
        session: string,
        msgid: string,
        newmsgid: string,
        replacemsg: string,
      }
    }
  }

  try {
    const jsonPayload: XmlSchema = await xmlToJson(text)
    const result: PadplusRecalledMessagePayload = {
      msgId: jsonPayload.sysmsg.revokemsg.msgid,
      newMsgId: jsonPayload.sysmsg.revokemsg.newmsgid,
      replaceMsg: jsonPayload.sysmsg.revokemsg.replacemsg,
      session: jsonPayload.sysmsg.revokemsg.session,
    }
    return result
  } catch (e) {
    return null
  }
}
