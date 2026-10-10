import type { Tone } from './tone.constants'

/** The statuses of a run, in the order a run goes through them. */
export const runStatuses = [
  'queued',
  'running',
  'interrupted',
  'succeeded',
  'failed',
  'cancelled',
] as const

export type RunStatus = (typeof runStatuses)[number]

/** How a run status reads in a sentence, for example "Run 3: waiting for review". */
export const runStatusLabels = {
  queued: 'queued',
  running: 'running',
  interrupted: 'waiting for review',
  succeeded: 'done',
  failed: 'failed',
  cancelled: 'cancelled',
} as const satisfies Record<RunStatus, string>

export const runStatusTones = {
  queued: 'neutral',
  running: 'primary',
  interrupted: 'warning',
  succeeded: 'success',
  failed: 'destructive',
  cancelled: 'neutral',
} as const satisfies Record<RunStatus, Tone>

/**
 * Which run needs the user most, lowest first: a run waiting for review, then a running one, then
 * a queued one. Finished runs come last.
 */
export const runStatusUrgency = {
  interrupted: 0,
  running: 1,
  queued: 2,
  failed: 3,
  succeeded: 4,
  cancelled: 5,
} as const satisfies Record<RunStatus, number>
