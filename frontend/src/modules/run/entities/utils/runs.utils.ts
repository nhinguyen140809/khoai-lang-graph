import type { RunStatus } from '../types/run-status.types'

// A run that has not started has no stage yet, and a run that is done needs none.
const statusesWithoutStage: RunStatus[] = ['queued', 'succeeded']

/** Whether the status of a run names its stage: where it works, waits, failed or was stopped. */
export function showsStage(status: RunStatus): boolean {
  return !statusesWithoutStage.includes(status)
}
