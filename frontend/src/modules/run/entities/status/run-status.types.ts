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
