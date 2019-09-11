#!/usr/bin/env ts-node

// tslint:disable:no-shadowed-variable
import test  from 'blue-tape'

import {
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
}                                       from './friendship-event-message-parser'

test('friendshipConfirmEventMessageParser()', async t => {
  t.equal(
    await friendshipConfirmEventMessageParser(undefined as any),
    null,
    'should parse `undefined`',
  )
  t.equal(
    await friendshipConfirmEventMessageParser(null as any),
    null,
    'should parse `null`',
  )
  t.equal(
    await friendshipConfirmEventMessageParser({} as any),
    null,
    'should parse `{}`',
  )
  t.equal(
    await friendshipConfirmEventMessageParser({ content: 'fadsfsfasfs' } as any),
    null,
    'should parse invalid content',
  )
})

test('friendshipReceiveEventMessageParser()', async t => {
  t.equal(
    await friendshipReceiveEventMessageParser(undefined as any),
    null,
    'should parse `undefined`',
  )
  t.equal(
    await friendshipReceiveEventMessageParser(null as any),
    null,
    'should parse `null`',
  )
  t.equal(
    await friendshipReceiveEventMessageParser({} as any),
    null,
    'should parse `{}`',
  )
  t.equal(
    await friendshipReceiveEventMessageParser({ content: 'fadsfsfasfs' } as any),
    null,
    'should parse invalid content',
  )
})

test('friendshipVerifyEventMessageParser()', async t => {
  t.equal(
    await friendshipVerifyEventMessageParser(undefined as any),
    null,
    'should parse `undefined`',
  )
  t.equal(
    await friendshipVerifyEventMessageParser(null as any),
    null,
    'should parse `null`',
  )
  t.equal(
    await friendshipVerifyEventMessageParser({} as any),
    null,
    'should parse `{}`',
  )
  t.equal(
    await friendshipVerifyEventMessageParser({ content: 'fadsfsfasfs' } as any),
    null,
    'should parse invalid content',
  )
})
