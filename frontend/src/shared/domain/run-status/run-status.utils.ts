import { unfinishedRunStatuses } from './run-status.constants'
import type { RunStatus, UnfinishedRunStatus } from './run-status.types'

export function isUnfinishedRunStatus(status: RunStatus): status is UnfinishedRunStatus {
  return (unfinishedRunStatuses as readonly RunStatus[]).includes(status)
}
