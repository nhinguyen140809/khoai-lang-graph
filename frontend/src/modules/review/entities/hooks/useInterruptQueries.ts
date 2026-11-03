import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import {
  type LiveRunQueryOptions,
  refetchIntervalOf,
  type RunStatus,
} from '@/modules/run/entities/@x/review'
import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { findPendingInterrupt, listRunInterrupts } from '../interrupts.api'
import { interruptsPageSize } from '../interrupts.constants'
import { interruptKeys } from '../interrupts.keys'

/**
 * Every interrupt of a run, the ones taken with the defaults included, a page at a time. The list
 * is read again while the run works, since it reaches more checkpoints.
 */
export function useRunInterrupts(
  runId: string,
  { isEnabled = true, runStatus }: LiveRunQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: interruptKeys.list(runId),
    queryFn: ({ pageParam }) => listRunInterrupts(runId, pageParam, interruptsPageSize),
    ...cursorPagesOptions,
    refetchInterval: refetchIntervalOf(runStatus),
    enabled: isEnabled,
  })
}

/** The options of the hook that reads the pending interrupt of a run. */
interface PendingInterruptOptions extends HookQueryOptions {
  /** The status of the run: its pending interrupt is read only while the run is interrupted. */
  runStatus: RunStatus | undefined
}

/**
 * What the run waits for, read only while the run is interrupted; null when it waits for nothing.
 * Once the run goes on, it gives nothing, though the last answer stays in the cache. It never
 * polls: the answer and the interrupt event of the run load it again.
 */
export function usePendingInterrupt(
  runId: string,
  { isEnabled = true, runStatus }: PendingInterruptOptions,
) {
  const isInterrupted = runStatus === 'interrupted'
  return useQuery({
    queryKey: interruptKeys.pending(runId),
    queryFn: () => findPendingInterrupt(runId),
    enabled: isEnabled && isInterrupted,
    select: (pending) => (isInterrupted ? pending : undefined),
  })
}
