import type { RunEventType } from '../run-events.types'

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
