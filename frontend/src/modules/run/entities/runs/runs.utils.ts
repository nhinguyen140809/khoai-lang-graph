import type { RunStatus } from '../status/run-status.types'
import { isUnfinishedRunStatus } from '../status/run-status.utils'
import { runPollIntervalMs } from './runs.constants'
import type { Run } from './runs.types'

/** How long to wait before a run is read again, for its status: until it ends, then never. */
export function refetchIntervalOf(status: RunStatus | null | undefined): number | false {
  return status != null && isUnfinishedRunStatus(status) ? runPollIntervalMs : false
}

/**
 * The runs that a run retried from, the oldest first: the run it retries, the run that one
 * retried, and so on. A run that is not a retry, or whose earlier run is not in the list, has
 * none further back.
 */
export function retriedRunsOf(
  run: Pick<Run, 'retry_of_run_id'>,
  runs: readonly Pick<Run, 'id' | 'retry_of_run_id'>[],
): Pick<Run, 'id' | 'retry_of_run_id'>[] {
  const chain: Pick<Run, 'id' | 'retry_of_run_id'>[] = []
  let next = run.retry_of_run_id
  while (next !== null && chain.length < runs.length) {
    const earlier = runs.find(({ id }) => id === next)
    if (earlier === undefined) break
    chain.unshift(earlier)
    next = earlier.retry_of_run_id
  }
  return chain
}
