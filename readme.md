# WECHATY-PUPPET-PADPLUS

[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-blue.svg)](https://github.com/chatie/wechaty)
[![NPM Version](https://badge.fury.io/js/wechaty-puppet-padplus.svg)](https://www.npmjs.com/package/wechaty-puppet-padplus)
[![npm (tag)](https://img.shields.io/npm/v/wechaty-puppet-padplus/next.svg)](https://www.npmjs.com/package/wechaty-puppet-padplus?activeTab=versions)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Linux/Mac Build Status](https://travis-ci.com/wechaty/wechaty-puppet-padplus.svg?branch=master)](https://travis-ci.com/wechaty/wechaty-puppet-padplus) 

## Notice

Our Mission: Make it easy to build a WeChat Chatbot for developers.

We provide a **free** token for the developers who have a strong will and ability to build a valuable chatbot for users.

See more: [Token Support](https://github.com/juzibot/Welcome/wiki/Support-Developers), [Everything about wechaty](https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty)

## Install

### 1. Init

#### 1.1. Check your `Node` version first

```js
node --version // v10.16.0 (BTW v10.0.0 < version < v11.0.0 is better)
```

> for windows system

To make sure you could install `wechaty-puppet-padplus` successfully, you have to start PowerShell as Administrator and run these commands:

```js
npm install -g windows-build-tools

npm install -g node-gyp
```

#### 1.2. Create your bot folder and do some init config

```js
mkdir my-padplus-bot && cd my-padplus-bot

npm init -y

npm install ts-node typescript -g

tsc --init
```

### 2. Install the bot dependency

```js
npm install wechaty@latest

npm install wechaty-puppet-padplus@latest
```

Or some new features developing version:

```js
npm install wechaty@next

npm install wechaty-puppet-padplus@next
```

### 3. Install other dependency

> There's no need to install `wechaty-puppet` in my-padplus-bot

```js
npm install qrcode-terminal
...
```

### 4. Other Tips

> If step 1~3 can not help you install successfully, please try this suggestion, otherwise just skip it please.

```js
rm -rf node_modules package-lock.json
npm install
```

> If you want to see detail logs about your bot, just run:

```js
BROLOG_LEVEL=silly ts-node index.ts
```

or

```js
BROLOG_LEVEL=silly node index.js
```

## Example

```js
// bot.js
import { Wechaty } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import { PuppetPadplus } from 'wechaty-puppet-padplus'
import QrcodeTerminal from 'qrcode-terminal'

const token = 'your-token'

const puppet = new PuppetPadplus({
  token,
})

const name  = 'your-bot-name'

const bot = new Wechaty({
  puppet,
  name, // generate xxxx.memory-card.json and save login data for the next login
})

bot
  .on('scan', (qrcode, status) => {
    if (status === ScanStatus.Waiting) {
      QrcodeTerminal.generate(qrcode, {
        small: true
      })
    }
  })
  .on('message', msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```

## How to emit the message that you sent

Please use environment variable `PADPLUS_REPLAY_MESSAGE` to activate this function.

```shell
PADPLUS_REPLAY_MESSAGE=true node index.js
```

## Puppet Comparison

功能 | padpro | padplus | macpro
---|---|---|---
 **<消息>**|  |  |
 收发文本| ✅ |✅ |✅
 收发个人名片| ✅ |✅ |✅
 收发图文链接| ✅ |✅ |✅
 发送图片、文件| ✅ | ✅（对内容有大小限制，20M以下） |✅
 接收图片、文件| ✅ | ✅（对内容有大小限制，25M以下） |✅
 发送视频| ✅ | ✅ | ✅
 接收视频| ✅ | ✅ | ✅
 发送小程序| ❌ | ✅ | ✅
 接收动图| ❌ | ✅ | ✅
 发送动图| ❌ | ✅ | ✅
 接收语音消息| ✅ | ✅ | ✅
 发送语音消息| ✅ | ❌ | ❌
 转发文本| ✅ | ✅ | ✅
 转发图片| ✅ | ✅ | ✅
 转发图文链接| ✅ | ✅ | ✅
 转发音频| ✅ | ❌ | ✅
 转发视频| ✅ | ✅ | ✅
 转发文件| ✅ | ✅ | ✅
 转发动图| ❌ | ❌ | ❌
 转发小程序| ❌ | ✅ | ❌
 **<群组>**|  |  |
 创建群聊|✅|✅|✅
 设置群公告|✅|✅|✅
 获取群公告|❌|✅|❌
 群二维码|✅|✅|✅
 拉人进群|✅|✅|✅
 踢人出群|✅|✅|✅
 退出群聊|✅|✅|✅
 改群名称|✅|✅|✅
 入群事件|✅|✅|✅
 离群事件|✅|✅|✅
 群名称变更事件|✅|✅|✅
 @群成员|✅|✅|✅
 群列表|✅|✅|✅
 群成员列表|✅|✅|✅
 群详情|✅|✅|✅
 **<联系人>**|  |  |
 修改备注|✅|✅|✅
 添加好友|✅|✅|✅
 自动通过好友|✅|✅|❌
 添加好友|✅|✅|✅
 好友列表|✅|✅|✅
 好友详情|✅|✅|✅
 **<其他>**|  |  |
 登录微信|✅|✅|✅
 扫码状态|✅|✅|❌
 退出微信|✅|✅|✅
 依赖协议|iPad|iPad|Mac|

