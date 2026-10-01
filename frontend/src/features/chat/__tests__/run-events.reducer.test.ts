import { describe, expect, it } from 'vitest'

import type { RunEvent } from '../chat.types'
import { applyRunEvent, initialRunState, parseRunEvent } from '../run-events.reducer'

function replay(events: RunEvent[]) {
  return events.reduce(applyRunEvent, initialRunState)
}

describe('applyRunEvent', () => {
  it('accumulates tokens and tracks the active node', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'token', id: '2', data: { node: 'agent', text: 'Hello' } },
      { type: 'token', id: '3', data: { node: 'agent', text: ' world' } },
    ])

    expect(state).toMatchObject({
      status: 'streaming',
      activeNode: 'agent',
      text: 'Hello world',
      lastEventId: '3',
    })
  })

  it('marks the run succeeded on done', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'done', id: '2', data: {} },
    ])

    expect(state).toMatchObject({ status: 'succeeded', activeNode: null })
  })

  it('marks the run failed on error', () => {
    const state = replay([{ type: 'error', id: '1', data: { message: 'boom' } }])

    expect(state).toMatchObject({ status: 'failed', error: 'boom' })
  })
})

describe('parseRunEvent', () => {
  it('parses a valid payload', () => {
    expect(parseRunEvent('token', '7', '{"node":"agent","text":"hi"}')).toEqual({
      type: 'token',
      id: '7',
      data: { node: 'agent', text: 'hi' },
    })
  })

  it('rejects invalid JSON and payloads that do not match the schema', () => {
    expect(parseRunEvent('token', '1', 'not json')).toBeNull()
    expect(parseRunEvent('token', '1', '{"node":"agent"}')).toBeNull()
  })
})
