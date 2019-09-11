import { PuppetPadplus } from '../src/index'
// import { Receiver } from 'wechaty-puppet';

function test () {
  const padplus = new PuppetPadplus({
    token: 'guxiaobei-test-token',
    name: 'chenhuitest'
  })
  padplus.start()

  // setTimeout(async () => {
  //   const receiver: Receiver = {
  //     contactId: 'botorange333'
  //   }
  //   await padplus.messageSendText(receiver, 'hahahhahah')
  // }, 3000)
}

test()