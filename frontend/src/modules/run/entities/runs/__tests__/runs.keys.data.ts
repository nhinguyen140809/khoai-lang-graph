import { runModuleKeys } from '../run-module.keys'
import { runKeys } from '../runs.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: runKeys.all(), wider: runModuleKeys.all() },
  { name: 'the lists of runs', key: runKeys.lists(), wider: runKeys.all() },
  { name: 'the runs of a thread', key: runKeys.ofThread('t1'), wider: runKeys.lists() },
  { name: 'the newest run of a thread', key: runKeys.latestOfThread('t1'), wider: runKeys.all() },
  { name: 'one run', key: runKeys.detail('r1'), wider: runKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the runs of two threads',
    first: runKeys.ofThread('t1'),
    second: runKeys.ofThread('t2'),
  },
  {
    name: 'the runs and the newest run of a thread',
    first: runKeys.ofThread('x'),
    second: runKeys.latestOfThread('x'),
  },
  { name: 'two runs', first: runKeys.detail('r1'), second: runKeys.detail('r2') },
  {
    name: 'a run and a thread of the same id',
    first: runKeys.detail('x'),
    second: runKeys.ofThread('x'),
  },
]
