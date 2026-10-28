import { chainKeys } from '../chains.keys'
import { traceModuleKeys } from '../trace-module.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: chainKeys.all(), wider: traceModuleKeys.all() },
  { name: 'the trace of an item', key: chainKeys.ofItem('i1', {}), wider: chainKeys.all() },
  {
    name: 'the trace of an artifact',
    key: chainKeys.ofArtifact('a1', { direction: 'backward', depth: 2 }),
    wider: chainKeys.all(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the trace of an item and of an artifact',
    first: chainKeys.ofItem('x', {}),
    second: chainKeys.ofArtifact('x', {}),
  },
  {
    name: 'the trace of two directions',
    first: chainKeys.ofItem('i1', { direction: 'backward' }),
    second: chainKeys.ofItem('i1', { direction: 'forward' }),
  },
  {
    name: 'the trace of two depths',
    first: chainKeys.ofArtifact('a1', {}),
    second: chainKeys.ofArtifact('a1', { depth: 1 }),
  },
]
