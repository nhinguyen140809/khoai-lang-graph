import { runKeys } from '../runs.keys'

/** A key of the runs, and the key above it. */
export const keyCases = [
  { name: 'the latest run of a thread', key: runKeys.latestRun('t1'), wider: runKeys.all() },
]
