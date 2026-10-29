import { runPollIntervalMs } from '../runs.constants'

/** The status of a run, and how long to wait before the run is read again. */
export const pollCases = [
  { name: 'a run that is queued', status: 'queued' as const, interval: runPollIntervalMs },
  { name: 'a run that works', status: 'running' as const, interval: runPollIntervalMs },
  { name: 'a run that waits', status: 'interrupted' as const, interval: runPollIntervalMs },
  { name: 'a run that is done', status: 'succeeded' as const, interval: false },
  { name: 'a run that failed', status: 'failed' as const, interval: false },
  { name: 'a run that was stopped', status: 'cancelled' as const, interval: false },
  { name: 'a thread without a run', status: null, interval: false },
  { name: 'a run not loaded yet', status: undefined, interval: false },
]
