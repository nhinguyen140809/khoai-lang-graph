import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'

/** The run that Stop stops: the given run while it has not finished. Null without a run, and once it has ended. */
export function stoppableRun(run: Run | null): Run | null {
  return run !== null && isUnfinishedRunStatus(run.status) ? run : null
}
