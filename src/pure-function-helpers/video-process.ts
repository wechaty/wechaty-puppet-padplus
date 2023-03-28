import { FileBox } from 'file-box'
import { VideoContent } from '../schemas'
import { PadplusMessage } from '../padplus-manager/api-request/message'
import { log } from '../config'
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const extractFrames = require('ffmpeg-extract-frames')
const probe = require('ffmpeg-probe')

export async function videoPreProcess (request: PadplusMessage, url: string): Promise<VideoContent> {
  const name = `screenshot-${Date.now()}.jpg`
  const path = './screenshot/' + name
  log.info(`videoPreProcess ffmpegPath: ${ffmpegPath}`)
  await extractFrames({
    ffmpegPath,
    input: url,
    offsets: [1],
    output: path,
  })
  const info = await probe(url)

  const fileBox = FileBox.fromFile(path, name)
  const thumb = await request.uploadFile(fileBox)

  const videoContent: VideoContent = {
    cdnthumbheight: info.height,
    cdnthumbwidth: info.width,
    playlength: info.duration / 1000,
    thumb,
    url,
  }

  return videoContent

}
