import type { RunStatus } from '@/modules/run/entities'

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
