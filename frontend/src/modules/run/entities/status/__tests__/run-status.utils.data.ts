import type { Wording } from '@/shared/lib/view'

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

/** A status of a run, or none, and its label in each view. */
export const labelCases: { name: string; status: RunStatus | null; label: Wording }[] = [
  {
    name: 'a review that waits',
    status: 'interrupted',
    label: { developer: 'Waiting for review', user: 'Waiting for you' },
  },
  { name: 'no run yet', status: null, label: { developer: 'No run yet', user: 'Not started' } },
]
