import { describe, expect, it } from 'vitest'

import type { RunEvent } from '../console.types'
import { applyRunEvent, initialRunState, parseRunEvent } from '../run-events.reducer'

function replay(events: RunEvent[]) {
  return events.reduce(applyRunEvent, initialRunState)
}

describe('applyRunEvent', () => {
  it('prints a node line, accumulates its tokens into one log entry, and tracks the active node', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'planner' } },
      { type: 'token', id: '2', data: { node: 'planner', text: 'An elicitation plan' } },
      { type: 'token', id: '3', data: { node: 'planner', text: ' for the mentor platform.' } },
    ])

    expect(state).toMatchObject({
      status: 'streaming',
      activeNode: 'planner',
      lastEventId: '3',
    })
    expect(state.entries).toEqual([
      { kind: 'node', id: '1', node: 'planner', state: 'running' },
      {
        kind: 'text',
        id: '2',
        node: 'planner',
        text: 'An elicitation plan for the mentor platform.',
      },
    ])
  })

  it('keeps the text of two nodes in entries of their own', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'planner' } },
      { type: 'token', id: '2', data: { node: 'planner', text: 'Plan...' } },
      { type: 'node_end', id: '3', data: { node: 'planner' } },
      { type: 'node_start', id: '4', data: { node: 'analyst' } },
      { type: 'token', id: '5', data: { node: 'analyst', text: 'Analysis...' } },
    ])

    expect(state.entries).toEqual([
      { kind: 'node', id: '1', node: 'planner', state: 'finished' },
      { kind: 'text', id: '2', node: 'planner', text: 'Plan...' },
      { kind: 'node', id: '4', node: 'analyst', state: 'running' },
      { kind: 'text', id: '5', node: 'analyst', text: 'Analysis...' },
    ])
    expect(state.activeNode).toBe('analyst')
  })

  it('appends the details a node produces to the log', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'planner' } },
      {
        type: 'tool_call',
        id: '2',
        data: { node: 'planner', tool: 'retrieve_items', args: { kind: 'raw_requirement' } },
      },
      {
        type: 'artifact_created',
        id: '3',
        data: { artifact_id: 'a1', name: 'Elicitation plan', version: 1 },
      },
      { type: 'node_end', id: '4', data: { node: 'planner' } },
    ])

    expect(state.entries).toEqual([
      { kind: 'node', id: '1', node: 'planner', state: 'finished' },
      { kind: 'tool_call', id: '2', node: 'planner', tool: 'retrieve_items' },
      { kind: 'artifact', id: '3', name: 'Elicitation plan', version: 1 },
    ])
  })

  it('marks the run done, closing the line of the node it ended in', () => {
    const state = replay([
      { type: 'node_start', id: '1', data: { node: 'planner' } },
      { type: 'done', id: '2', data: {} },
    ])

    expect(state).toMatchObject({ status: 'succeeded', activeNode: null })
    expect(state.entries).toEqual([
      { kind: 'node', id: '1', node: 'planner', state: 'finished' },
      { kind: 'done', id: '2' },
    ])
  })

  it('marks the run interrupted at the node that asked for review, and failed on an error', () => {
    const interrupted = replay([
      { type: 'node_start', id: '1', data: { node: 'checkpoint_analysis' } },
      { type: 'interrupt', id: '2', data: { node: 'checkpoint_analysis', payload: {} } },
    ])
    expect(interrupted.entries).toEqual([
      { kind: 'node', id: '1', node: 'checkpoint_analysis', state: 'finished' },
      { kind: 'interrupt', id: '2', node: 'checkpoint_analysis' },
    ])
    expect(interrupted.status).toBe('interrupted')

    const failed = replay([{ type: 'error', id: '1', data: { message: 'boom' } }])
    expect(failed).toMatchObject({ status: 'failed', error: 'boom' })
    expect(failed.entries).toEqual([{ kind: 'error', id: '1', message: 'boom' }])
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
