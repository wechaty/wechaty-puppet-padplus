#!/usr/bin/env ts-node

import { test } from 'tstest'

import { PuppetPadplus } from './puppet-padplus'
import { MemoryCard } from 'memory-card'

test('PuppetPlus restart without problem', async (t) => {
  const memory = new MemoryCard()
  await memory.load()
  await memory.set('WECHATY_PUPPET_PADPLUS', {
    uin: true,
  })

  const puppet = new PuppetPadplus()
  puppet.setMemory(memory)

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
