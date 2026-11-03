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
    event: { id: '1', type: 'artifact_created', data: { artifact_id: 'b', name: 'B', version: 1 } },
    result: ['a', 'b'],
  },
  {
    name: 'a delta of an artifact in the set changes nothing',
    ids: ['a'],
    event: { id: '1', type: 'artifact_delta', data: { artifact_id: 'a', delta: 'x' } },
    result: ['a'],
  },
  {
    name: 'a delta of another artifact joins the set',
    ids: ['a'],
    event: { id: '1', type: 'artifact_delta', data: { artifact_id: 'b', delta: 'x' } },
    result: ['a', 'b'],
  },
  {
    name: 'a node that starts empties the set',
    ids: ['a'],
    event: { id: '1', type: 'node_start', data: { node: 'n' } },
    result: [],
  },
  {
    name: 'a node that ends empties the set',
    ids: ['a'],
    event: { id: '1', type: 'node_end', data: { node: 'n' } },
    result: [],
  },
  {
    name: 'an interrupt empties the set',
    ids: ['a'],
    event: { id: '1', type: 'interrupt', data: { node: 'n', payload: null } },
    result: [],
  },
  {
    name: 'an error empties the set',
    ids: ['a'],
    event: { id: '1', type: 'error', data: { message: 'm' } },
    result: [],
  },
  {
    name: 'the end of the run empties the set',
    ids: ['a'],
    event: { id: '1', type: 'done', data: {} },
    result: [],
  },
  {
    name: 'a token changes nothing',
    ids: ['a'],
    event: { id: '1', type: 'token', data: { node: 'n', text: 't' } },
    result: ['a'],
  },
]
