import type { Wording } from '@/shared/lib/view'

import type { RunStatus } from '../types/run-status.types'

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
 * The label of each run status in each view: "Waiting for review" for a developer, "Waiting for
 * you" for a user.
 */
export const runStatusLabels = {
  queued: { developer: 'Queued', user: 'Starting' },
  running: { developer: 'Running', user: 'Working' },
  interrupted: { developer: 'Waiting for review', user: 'Waiting for you' },
  succeeded: { developer: 'Done', user: 'Done' },
  failed: { developer: 'Failed', user: 'Failed' },
  cancelled: { developer: 'Cancelled', user: 'Stopped' },
} as const satisfies Record<RunStatus, Wording>

/** The label of a project or a thread that has no run yet, in each view. */
export const noRunLabel = {
  developer: 'No run yet',
  user: 'Not started',
} as const satisfies Wording
