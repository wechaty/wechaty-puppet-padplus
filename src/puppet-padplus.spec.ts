#!/usr/bin/env ts-node

import { test } from 'tstest'

import { PuppetPadplus } from './puppet-padplus'

test('PuppetPlus restart without problem', async (t) => {

  const puppet = new PuppetPadplus()

  try {
    for (let i = 0; i < 3; i++) {
      await puppet.start()
      await puppet.stop()
      t.pass('start/stop-ed at #' + i)
    }
    t.pass('PuppetPadplus() start/restart successed.')
  } catch (e) {
    t.fail(e)
  }
})
