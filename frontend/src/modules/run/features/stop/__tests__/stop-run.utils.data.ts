import { buildMockRun } from '@/mocks/runs/runs.fixtures'
import type { Run, RunStatus } from '@/modules/run/entities'

function runWith(status: RunStatus): Run {
  return buildMockRun({ id: 'r1', thread_id: 't1', project_id: 'p1', number: 1, status })
}

/** A run, and whether Stop stops it. */
export const stoppableRunCases: { name: string; run: Run | null; stoppable: boolean }[] = [
  { name: 'no run', run: null, stoppable: false },
  { name: 'a run about to start', run: runWith('queued'), stoppable: true },
  { name: 'a run that works', run: runWith('running'), stoppable: true },
  { name: 'a run that waits for a review', run: runWith('interrupted'), stoppable: true },
  { name: 'a run that is done', run: runWith('succeeded'), stoppable: false },
  { name: 'a run that failed', run: runWith('failed'), stoppable: false },
  { name: 'a run that was stopped', run: runWith('cancelled'), stoppable: false },
]
