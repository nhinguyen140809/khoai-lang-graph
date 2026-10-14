import type { Tone } from '@/shared/lib/tone.constants'

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

/** The statuses of a run that has not ended; a thread has at most one such run. */
export const unfinishedRunStatuses = [
  'queued',
  'running',
  'interrupted',
] as const satisfies readonly RunStatus[]

export type UnfinishedRunStatus = (typeof unfinishedRunStatuses)[number]

export function isUnfinishedRunStatus(status: RunStatus): status is UnfinishedRunStatus {
  return (unfinishedRunStatuses as readonly RunStatus[]).includes(status)
}

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
