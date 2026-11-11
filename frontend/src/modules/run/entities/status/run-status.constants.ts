import type { Wording } from '@/shared/lib/view'

import type { RunStatus } from './run-status.types'

/**
 * The statuses of a run, from the one that needs the user most: a review that waits, a run that
 * failed, a run that works or is about to start, a run that was stopped, then a run that is done.
 */
export const runStatusesByAttention = [
  'interrupted',
  'failed',
  'running',
  'queued',
  'cancelled',
  'succeeded',
] as const satisfies readonly RunStatus[]

/**
 * The label of each run status in each view; the user view reads the label of the developer view
 * until a status has words of its own for it.
 */
export const runStatusLabels = {
  queued: { developer: 'Starting' },
  running: { developer: 'Working' },
  interrupted: { developer: 'Waiting for you' },
  succeeded: { developer: 'Done' },
  failed: { developer: 'Failed' },
  cancelled: { developer: 'Stopped' },
} as const satisfies Record<RunStatus, Wording>

/** The label of a project or a thread that has no run yet, in each view. */
export const noRunLabel = { developer: 'Not started' } as const satisfies Wording
