import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import type { LiveRunQueryOptions } from '../../runs/run-queries.types'
import { refetchIntervalOf } from '../../runs/runs.utils'
import { getCurrentRunState, getRunStateAfterStep } from '../run-state.api'
import { stepStateStaleTime } from '../run-state.constants'
import { runStateKeys } from '../run-state.keys'

/** The workflow state of a run now, read again while the run works. */
export function useCurrentRunState(
  runId: string,
  { isEnabled = true, runStatus }: LiveRunQueryOptions = {},
) {
  return useQuery({
    queryKey: runStateKeys.current(runId),
    queryFn: () => getCurrentRunState(runId),
    refetchInterval: refetchIntervalOf(runStatus),
    enabled: isEnabled,
  })
}

/** The workflow state of a run after one of its steps. It never changes, so it is kept. */
export function useRunStateAfterStep(
  runId: string,
  stepId: string,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: runStateKeys.afterStep(runId, stepId),
    queryFn: () => getRunStateAfterStep(runId, stepId),
    staleTime: stepStateStaleTime,
    enabled: isEnabled,
  })
}
