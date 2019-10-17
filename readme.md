# WECHATY-PUPPET-PADPLUS

[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-blue.svg)](https://github.com/chatie/wechaty)
[![NPM Version](https://badge.fury.io/js/wechaty-puppet-padplus.svg)](https://www.npmjs.com/package/wechaty-puppet-padplus)
[![npm (tag)](https://img.shields.io/npm/v/wechaty-puppet-padplus/next.svg)](https://www.npmjs.com/package/wechaty-puppet-padplus?activeTab=versions)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Linux/Mac Build Status](https://travis-ci.com/botorange/wechaty-puppet-padplus.svg?branch=master)](https://travis-ci.com/botorange/wechaty-puppet-padplus)

## Notice

1. Wechaty-puppet-padplus is still in very Early Alpha Stage, please make sure you have the necessary engineering technics to deal with the bugs instead of just asking for support.
2. You are welcome to file an issue to reproduce the problem, if it is reproducible, we will fix that as soon as possible.
3. If you need a stable version, please keep waiting until we release the stable one.

## Install

### 1. Init

```js
mkdir padplus

npm init
```

### 2. Install the latest wechaty

```js
npm install wechaty
```

### 3. Install wechaty-puppet-padplus

> Notice: wechaty-puppet-padplus still in alpha test period, so we keep updating the package, you should install the latest packge by using `@latest` until we release the stable package.

```js
npm install wechaty-puppet-padplus@latest
```

### 4. Install other dependency

```js
npm install qrcode-terminal
```

## Example

```js
import { Wechaty       } from 'wechaty';
import { PuppetPadplus } from 'wechaty-puppet-padplus';
import { generate      } from 'qrcode-terminal';

const token = 'your-token';

const puppet = new PuppetPadplus({
  token,
})

const bot = new Wechaty({
  puppet,
});

bot
  .on('scan', (qrcode) => {
    generate(qrcode, {
      small: true
    });
  })
  .on('message', msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```
