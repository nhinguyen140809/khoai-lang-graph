import { isUnfinishedRunStatus, type Run, type RunStep } from '@/modules/run/entities'

/**
 * The step that a retry of the run starts from: the first step that failed. None while the run has
 * not ended, since a run starts only when no other works, and none when no step failed.
 */
export function retryableStep(run: Run, steps: readonly RunStep[]): RunStep | null {
  if (isUnfinishedRunStatus(run.status)) return null
  return steps.find(({ status }) => status === 'failed') ?? null
}
