import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'
import { type CostShare, costShare } from '@/shared/lib/cost'

import { findLatestRun, getRun, listThreadRuns } from '../runs.api'
import { runsPageSize } from '../runs.constants'
import { runKeys } from '../runs.keys'
import { refetchIntervalOf } from '../runs.utils'

/** The runs of a thread, the newest first, a page at a time. */
export function useThreadRuns(threadId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: runKeys.ofThread(threadId),
    queryFn: ({ pageParam }) => listThreadRuns(threadId, pageParam, runsPageSize),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/** The newest run of a thread, read again while it has not ended. */
export function useLatestRun(threadId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: runKeys.latestOfThread(threadId),
    queryFn: () => findLatestRun(threadId),
    refetchInterval: (query) => refetchIntervalOf(query.state.data?.status),
    enabled: isEnabled,
  })
}

/** One run, read again while it has not ended. */
export function useRun(runId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: runKeys.detail(runId),
    queryFn: () => getRun(runId),
    refetchInterval: (query) => refetchIntervalOf(query.state.data?.status),
    enabled: isEnabled,
  })
}

/**
 * The cost of the newest run of a thread against the limit of the run. Undefined while the run
 * loads, before the first run of the thread, and for a run without a limit.
 */
export function useRunCost(
  threadId: string,
  options: HookQueryOptions = {},
): CostShare | undefined {
  const run = useLatestRun(threadId, options)
  if (run.data == null) return undefined
  return costShare(run.data.usage.cost_usd, run.data.run_config.max_cost_usd)
}
