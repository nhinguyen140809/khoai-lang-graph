import { isOneOf } from '@/shared/lib/guards'
import type { Wording } from '@/shared/lib/view'

import { noRunLabel, runStatusLabels } from './run-status.constants'
import { type RunStatus, type UnfinishedRunStatus, unfinishedRunStatuses } from './run-status.types'

// A run that has not started has no stage yet, and a run that is done needs none.
const statusesWithoutStage: readonly RunStatus[] = ['queued', 'succeeded']

export function isUnfinishedRunStatus(status: RunStatus): status is UnfinishedRunStatus {
  return isOneOf(unfinishedRunStatuses, status)
}

/** The label of a run status in each view, or of no run yet for a project or a thread without one. */
export function runStatusLabel(status: RunStatus | null): Wording {
  return status === null ? noRunLabel : runStatusLabels[status]
}

/** Whether the label of a run status names its stage: where it works, waits, failed or was stopped. */
export function hasStageName(status: RunStatus): boolean {
  return !statusesWithoutStage.includes(status)
}

/** Whether a run in this status writes the documents, which the user then cannot change: `running` only. */
export function isWritingRunStatus(status: RunStatus): boolean {
  return status === 'running'
}
