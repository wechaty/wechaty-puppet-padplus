import { PuppetPadplus } from '../src/index'

function test () {
  const padplus = new PuppetPadplus({
    token: 'test-token',
    name: 'suchangtest'
  })
  padplus.start()
}

test()