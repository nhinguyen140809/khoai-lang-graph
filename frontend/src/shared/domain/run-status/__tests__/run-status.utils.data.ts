import type { Wording } from '@/shared/domain/view'

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

/** The statuses of several runs, and the status they roll up to. */
export const rollupCases: { name: string; statuses: RunStatus[]; rollup: RunStatus | null }[] = [
  {
    name: 'a review that waits before a failed run',
    statuses: ['failed', 'interrupted'],
    rollup: 'interrupted',
  },
  {
    name: 'a failed run before a run that works',
    statuses: ['running', 'failed', 'succeeded'],
    rollup: 'failed',
  },
  {
    name: 'a run that works before one about to start',
    statuses: ['queued', 'running'],
    rollup: 'running',
  },
  {
    name: 'a run about to start before a stopped run',
    statuses: ['cancelled', 'queued'],
    rollup: 'queued',
  },
  {
    name: 'a stopped run before a run that is done',
    statuses: ['succeeded', 'cancelled'],
    rollup: 'cancelled',
  },
  { name: 'runs that are all done', statuses: ['succeeded', 'succeeded'], rollup: 'succeeded' },
  { name: 'nothing without a run', statuses: [], rollup: null },
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
