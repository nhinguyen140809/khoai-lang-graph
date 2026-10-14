import type { RunStatus } from '../run-status.types'

/** A status of a run, and whether the run has not ended. */
export const unfinishedCases: [RunStatus, boolean][] = [
  ['queued', true],
  ['running', true],
  ['interrupted', true],
  ['succeeded', false],
  ['failed', false],
  ['cancelled', false],
]
