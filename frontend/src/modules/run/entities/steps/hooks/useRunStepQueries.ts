import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import { cursorPagesOptions } from '@/shared/api/query-client'

import type { LiveRunQueryOptions } from '../../runs/run-queries.types'
import { refetchIntervalOf } from '../../runs/runs.utils'
import { listRunSteps } from '../run-steps.api'
import { runStepsPageSize } from '../run-steps.constants'
import { runStepKeys } from '../run-steps.keys'

/** Loads the steps of a run again. */
export function useReloadRunSteps(): (runId: string) => Promise<void> {
  const queryClient = useQueryClient()
  return async (runId) => {
    await queryClient.invalidateQueries({ queryKey: runStepKeys.ofRun(runId) })
  }
}

/** The steps of a run, a page at a time; they are read again while the run works. */
export function useRunSteps(
  runId: string,
  { isEnabled = true, runStatus }: LiveRunQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: runStepKeys.ofRun(runId),
    queryFn: ({ pageParam }) => listRunSteps(runId, pageParam, runStepsPageSize),
    ...cursorPagesOptions,
    refetchInterval: refetchIntervalOf(runStatus),
    enabled: isEnabled,
  })
}
