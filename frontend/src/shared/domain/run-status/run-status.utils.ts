import type { Wording } from '@/shared/domain/view'

import {
  noRunLabel,
  runStatusesByAttention,
  runStatusLabels,
  unfinishedRunStatuses,
} from './run-status.constants'
import type { RunStatus, UnfinishedRunStatus } from './run-status.types'

export function isUnfinishedRunStatus(status: RunStatus): status is UnfinishedRunStatus {
  return (unfinishedRunStatuses as readonly RunStatus[]).includes(status)
}

/**
 * The status that several runs roll up to, such as the latest runs of the threads of a project:
 * the one that needs the user most, in the order of `runStatusesByAttention`. Null without a run.
 */
export function rollupRunStatus(statuses: readonly RunStatus[]): RunStatus | null {
  return runStatusesByAttention.find((status) => statuses.includes(status)) ?? null
}

/** The label of a run status in each view, or of no run yet for a project or a thread without one. */
export function runStatusLabel(status: RunStatus | null): Wording {
  return status === null ? noRunLabel : runStatusLabels[status]
}
