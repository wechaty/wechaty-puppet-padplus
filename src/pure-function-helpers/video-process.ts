import { FileBox } from 'wechaty-puppet'
import { RequestClient } from './../padplus-manager/api-request/request'
import { VideoContent } from '../schemas'
const extractFrames = require('ffmpeg-extract-frames')
const probe = require('ffmpeg-probe')

export async function videoPreProcess (request: RequestClient, url: string): Promise<VideoContent> {
  const name = `screenshot-${Date.now()}.jpg`
  const path = './screenshot/' + name
  await extractFrames({
    input: url,
    offsets: [1],
    output: path,
  })
  const info = await probe(url)

  const fileBox = FileBox.fromFile(path)
  const thumb = await request.uploadFile(name, await fileBox.toStream())

  const videoContent: VideoContent = {
    cdnthumbheight: info.height,
    cdnthumbwidth: info.width,
    playlength: info.duration / 1000,
    thumb,
    url,
  }

  return videoContent

}
