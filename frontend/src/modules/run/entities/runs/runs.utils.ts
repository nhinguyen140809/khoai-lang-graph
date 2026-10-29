import type { RunStatus } from '../status/run-status.types'
import { isUnfinishedRunStatus } from '../status/run-status.utils'
import { runPollIntervalMs } from './runs.constants'

/** How long to wait before a run is read again, for its status: until it ends, then never. */
export function refetchIntervalOf(status: RunStatus | null | undefined): number | false {
  return status != null && isUnfinishedRunStatus(status) ? runPollIntervalMs : false
}
