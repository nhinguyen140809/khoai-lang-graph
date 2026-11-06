import type { RunEventType } from '../run-events.types'

interface PayloadCase {
  name: string
  type: RunEventType
  raw: string
}

// The usage that a step of the examples used.
const usage = {
  input_tokens: 6100,
  output_tokens: 2300,
  cache_read_tokens: 4800,
  cache_write_tokens: 0,
  cost_usd: 0.05,
  duration_ms: 31_000,
}

/** A payload of an event type that parses, with the fields the API carries, and the data read from it. */
export const validPayloadCases: (PayloadCase & { data: unknown })[] = [
  {
    name: 'the start of a node',
    type: 'node_start',
    raw: '{"node":"analyst","step_id":"e9d1","agent_role":"analyst","stage":"analysis","iteration":0,"persona_key":null}',
    data: {
      node: 'analyst',
      step_id: 'e9d1',
      agent_role: 'analyst',
      stage: 'analysis',
      iteration: 0,
      persona_key: null,
    },
  },
  {
    name: 'the start of a node that works on a subject',
    type: 'node_start',
    raw: '{"node":"interviewer","step_id":"e1a3","agent_role":"interviewer","stage":"interviewing","iteration":1,"persona_key":"PER-002"}',
    data: {
      node: 'interviewer',
      step_id: 'e1a3',
      agent_role: 'interviewer',
      stage: 'interviewing',
      iteration: 1,
      persona_key: 'PER-002',
    },
  },
  {
    name: 'the end of a node',
    type: 'node_end',
    raw: '{"node":"analyst","step_id":"e9d1","status":"succeeded","usage":{"input_tokens":6100,"output_tokens":2300,"cache_read_tokens":4800,"cache_write_tokens":0,"cost_usd":0.05,"duration_ms":31000}}',
    data: { node: 'analyst', step_id: 'e9d1', status: 'succeeded', usage },
  },
  {
    name: 'a token',
    type: 'token',
    raw: '{"node":"analyst","text":"hi","step_id":"e9d1"}',
    data: { node: 'analyst', text: 'hi', step_id: 'e9d1' },
  },
  {
    name: 'a tool call',
    type: 'tool_call',
    raw: '{"node":"analyst","tool":"search","args":{"kind":"conflict"},"step_id":"e9d1"}',
    data: { node: 'analyst', tool: 'search', args: { kind: 'conflict' }, step_id: 'e9d1' },
  },
  {
    name: 'an artifact created',
    type: 'artifact_created',
    raw: '{"artifact_id":"b210","name":"Requirements analysis","version":4,"kind":"requirements_analysis"}',
    data: {
      artifact_id: 'b210',
      name: 'Requirements analysis',
      version: 4,
      kind: 'requirements_analysis',
    },
  },
  {
    name: 'a delta of an artifact',
    type: 'artifact_delta',
    raw: '{"artifact_id":"b210","delta":"AR-007 created","version":4,"item_id":"d3f9","item_key":"AR-007","change":"item_created"}',
    data: {
      artifact_id: 'b210',
      delta: 'AR-007 created',
      version: 4,
      item_id: 'd3f9',
      item_key: 'AR-007',
      change: 'item_created',
    },
  },
  {
    name: 'a message delivered',
    type: 'message_delivered',
    raw: '{"message_id":"11a1","step_id":"e1a3","node":"interviewer"}',
    data: { message_id: '11a1', step_id: 'e1a3', node: 'interviewer' },
  },
  {
    name: 'a project named',
    type: 'project_named',
    raw: '{"step_id":"e1b4","project_id":"90aa","name":"Mentor platform"}',
    data: { step_id: 'e1b4', project_id: '90aa', name: 'Mentor platform' },
  },
  {
    name: 'an interrupt',
    type: 'interrupt',
    raw: '{"node":"checkpoint_analysis","step_id":"e9d2","payload":{"interrupt_id":"7b0c"}}',
    data: { node: 'checkpoint_analysis', step_id: 'e9d2', payload: { interrupt_id: '7b0c' } },
  },
  {
    name: 'an error',
    type: 'error',
    raw: '{"message":"The model provider failed","code":"provider_error","stage":"analysis"}',
    data: { message: 'The model provider failed', code: 'provider_error', stage: 'analysis' },
  },
  {
    name: 'the end of the run',
    type: 'done',
    raw: '{"status":"succeeded"}',
    data: { status: 'succeeded' },
  },
]

/** A payload of an event type that does not parse. */
export const invalidPayloadCases: PayloadCase[] = [
  { name: 'text that is not JSON', type: 'token', raw: 'not json' },
  { name: 'a token without its step', type: 'token', raw: '{"node":"agent","text":"hi"}' },
  {
    name: 'the start of a node without its stage',
    type: 'node_start',
    raw: '{"node":"analyst","step_id":"e9d1","agent_role":"analyst","iteration":0,"persona_key":null}',
  },
  {
    name: 'the end of a node without its usage',
    type: 'node_end',
    raw: '{"node":"analyst","step_id":"e9d1","status":"succeeded"}',
  },
  {
    name: 'a delta of an artifact without its change',
    type: 'artifact_delta',
    raw: '{"artifact_id":"b210","delta":"x","version":4,"item_id":null,"item_key":null}',
  },
  {
    name: 'a project named without its name',
    type: 'project_named',
    raw: '{"step_id":"e1b4","project_id":"90aa"}',
  },
  {
    name: 'an error without its code',
    type: 'error',
    raw: '{"message":"The work failed","stage":"analysis"}',
  },
  { name: 'the end of the run without its status', type: 'done', raw: '{}' },
]

/** An event type, and whether the run ends with it. */
export const terminalCases: [RunEventType, boolean][] = [
  ['done', true],
  ['error', true],
  ['interrupt', false],
  ['token', false],
]
