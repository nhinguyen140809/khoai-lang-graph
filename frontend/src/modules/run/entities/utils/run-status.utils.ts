import type { Wording } from '@/shared/lib/view'

import { noRunLabel, runStatusLabels } from '../constants/run-status.constants'
import {
  type RunStatus,
  type UnfinishedRunStatus,
  unfinishedRunStatuses,
} from '../types/run-status.types'

export function isUnfinishedRunStatus(status: RunStatus): status is UnfinishedRunStatus {
  return (unfinishedRunStatuses as readonly RunStatus[]).includes(status)
}

/** The label of a run status in each view, or of no run yet for a project or a thread without one. */
export function runStatusLabel(status: RunStatus | null): Wording {
  return status === null ? noRunLabel : runStatusLabels[status]
}
