#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  PadplusMessagePayload,
}                                 from '../schemas'

import {
  roomTopicEventMessageParser,
}                               from './room-event-topic-message-parser'

test('roomTopicEventMessageParser() not detected', async t => {
  t.equal(
    await roomTopicEventMessageParser(undefined as any),
    null,
    'should return null for undefined',
  )

  t.equal(
    await roomTopicEventMessageParser('null' as any),
    null,
    'should return null for null',
  )

  t.equal(
    await roomTopicEventMessageParser('test' as any),
    null,
    'should return null for string',
  )

  t.equal(
    await roomTopicEventMessageParser({} as any),
    null,
    'should return null for empty object',
  )

  t.equal(
    await roomTopicEventMessageParser({ content: 'fsdfsfsdfasfas' } as PadplusMessagePayload),
    null,
    'should return null for PadplusMessagePayload with unknown content',
  )

})
