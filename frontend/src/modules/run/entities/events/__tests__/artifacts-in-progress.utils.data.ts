import type { RunEvent } from '../run-events.types'

export const progressCases: {
  name: string
  ids: string[]
  event: RunEvent
  result: string[]
}[] = [
  {
    name: 'an artifact created joins the set',
    ids: ['a'],
    event: {
      id: '1',
      type: 'artifact_created',
      data: { artifact_id: 'b', name: 'B', version: 1, kind: 'requirements_analysis' },
    },
    result: ['a', 'b'],
  },
  {
    name: 'a delta of an artifact in the set changes nothing',
    ids: ['a'],
    event: {
      id: '1',
      type: 'artifact_delta',
      data: {
        artifact_id: 'a',
        delta: 'x',
        version: 1,
        item_id: null,
        item_key: null,
        change: 'artifact_updated',
      },
    },
    result: ['a'],
  },
  {
    name: 'a delta of another artifact joins the set',
    ids: ['a'],
    event: {
      id: '1',
      type: 'artifact_delta',
      data: {
        artifact_id: 'b',
        delta: 'x',
        version: 1,
        item_id: null,
        item_key: null,
        change: 'artifact_updated',
      },
    },
    result: ['a', 'b'],
  },
  {
    name: 'a node that starts empties the set',
    ids: ['a'],
    event: {
      id: '1',
      type: 'node_start',
      data: {
        node: 'n',
        step_id: 's1',
        agent_role: null,
        stage: 'planning',
        iteration: 0,
        persona_key: null,
      },
    },
    result: [],
  },
  {
    name: 'a node that ends empties the set',
    ids: ['a'],
    event: {
      id: '1',
      type: 'node_end',
      data: {
        node: 'n',
        step_id: 's1',
        status: 'succeeded',
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_tokens: 0,
          cache_write_tokens: 0,
          cost_usd: 0,
          duration_ms: 0,
        },
      },
    },
    result: [],
  },
  {
    name: 'an interrupt empties the set',
    ids: ['a'],
    event: { id: '1', type: 'interrupt', data: { node: 'n', step_id: 's1', payload: null } },
    result: [],
  },
  {
    name: 'an error empties the set',
    ids: ['a'],
    event: {
      id: '1',
      type: 'error',
      data: { message: 'm', code: 'provider_error', stage: 'analysis' },
    },
    result: [],
  },
  {
    name: 'the end of the run empties the set',
    ids: ['a'],
    event: { id: '1', type: 'done', data: { status: 'succeeded' } },
    result: [],
  },
  {
    name: 'a token changes nothing',
    ids: ['a'],
    event: { id: '1', type: 'token', data: { node: 'n', text: 't', step_id: 's1' } },
    result: ['a'],
  },
]
