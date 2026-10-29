import type { RunStreamState } from '../run-events.reducer'
import type { RunEvent, RunEventType } from '../run-events.types'

interface RunEventCase {
  name: string
  events: RunEvent[]
  state: Partial<RunStreamState>
}

/** The events of a run, in order, and the state they leave. */
export const runEventCases: RunEventCase[] = [
  {
    name: 'accumulates tokens and tracks the active node',
    events: [
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'token', id: '2', data: { node: 'agent', text: 'Hello' } },
      { type: 'token', id: '3', data: { node: 'agent', text: ' world' } },
    ],
    state: { status: 'streaming', activeNode: 'agent', text: 'Hello world', lastEventId: '3' },
  },
  {
    name: 'has no active node once the node ends',
    events: [
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'node_end', id: '2', data: { node: 'agent' } },
    ],
    state: { status: 'streaming', activeNode: null, lastEventId: '2' },
  },
  {
    name: 'waits on an interrupt',
    events: [
      { type: 'node_start', id: '1', data: { node: 'review' } },
      { type: 'interrupt', id: '2', data: { node: 'review', payload: null } },
    ],
    state: { status: 'interrupted', activeNode: 'review' },
  },
  {
    name: 'marks the run succeeded on done',
    events: [
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'done', id: '2', data: {} },
    ],
    state: { status: 'succeeded', activeNode: null },
  },
  {
    name: 'marks the run failed on error',
    events: [{ type: 'error', id: '1', data: { message: 'boom' } }],
    state: { status: 'failed', error: 'boom' },
  },
  {
    name: 'only moves past the id of a tool call',
    events: [
      { type: 'node_start', id: '1', data: { node: 'agent' } },
      { type: 'tool_call', id: '2', data: { node: 'agent', tool: 'search', args: {} } },
    ],
    state: { status: 'streaming', activeNode: 'agent', text: '', lastEventId: '2' },
  },
  {
    name: 'only moves past the id of a delivered message',
    events: [{ type: 'message_delivered', id: '4', data: {} }],
    state: { status: 'streaming', activeNode: null, text: '', lastEventId: '4' },
  },
]

interface PayloadCase {
  name: string
  type: RunEventType
  raw: string
}

/** A payload of an event type that parses, and the data read from it. */
export const validPayloadCases: (PayloadCase & { data: unknown })[] = [
  {
    name: 'a token',
    type: 'token',
    raw: '{"node":"agent","text":"hi"}',
    data: { node: 'agent', text: 'hi' },
  },
  {
    name: 'the start of a node',
    type: 'node_start',
    raw: '{"node":"planner"}',
    data: { node: 'planner' },
  },
  { name: 'the end of the run', type: 'done', raw: '{}', data: {} },
]

/** A payload of an event type that does not parse. */
export const invalidPayloadCases: PayloadCase[] = [
  { name: 'text that is not JSON', type: 'token', raw: 'not json' },
  { name: 'a token without its text', type: 'token', raw: '{"node":"agent"}' },
  { name: 'an error without its message', type: 'error', raw: '{}' },
]

/** An event type, and whether the run ends with it. */
export const terminalCases: [RunEventType, boolean][] = [
  ['done', true],
  ['error', true],
  ['interrupt', false],
  ['token', false],
]
