'use client'

import { useQueryClient } from '@tanstack/react-query'

import { hasCost } from '@/shared/api/query-client'
import { isOneOf } from '@/shared/lib/guards'
import { useCoalescedListener } from '@/shared/lib/scheduling'

import { runKeys } from '../../runs/runs.keys'
import type { Run } from '../../runs/runs.types'
import { isUnfinishedRunStatus } from '../../status/run-status.utils'
import { listenToRun } from '../run-event-channels.api'
import { runCostEvents, runStatusEvents } from '../run-events.constants'
import type { RunChannelSignal } from '../run-events.types'

/**
 * Follows the event stream of an unfinished run and loads the run again at each event that may
 * change its status or its stage, then calls `onReloaded` with it. The events of a burst share one
 * load, and an event that comes during a load is followed by one more, since the load that started
 * before it may answer without its change. An event that may change a cost also loads again every
 * query that holds a cost, and the events of a burst share that load too. It listens after the
 * latest event that the run had when it loaded, and stops after `done`. A connection that fails
 * for good loads the run again.
 */
export function useRunStatusEvents(
  run: Pick<Run, 'id' | 'thread_id' | 'status'> | null | undefined,
  onReloaded: (run: Run) => Promise<void> | void,
) {
  const queryClient = useQueryClient()
  const runId = run?.id ?? null
  const isUnfinished = run != null && isUnfinishedRunStatus(run.status)
  const key = isUnfinished ? runId : null

  const listenAfterLoaded = (listener: (signal: RunChannelSignal) => void) => {
    const queryKey = runKeys.latestOfThread(run?.thread_id ?? '')
    // Read when the stream opens only: the run loads again at each event, with a later id.
    const lastEventId = queryClient.getQueryData<Run | null>(queryKey)?.last_event_id
    return listenToRun(run?.id ?? '', listener, { after: lastEventId ?? null })
  }

  useCoalescedListener(key, {
    listen: listenAfterLoaded,
    isWanted: (signal) => signal.kind === 'failed' || isOneOf(runStatusEvents, signal.event.type),
    task: async ({ isClosed }) => {
      const queryKey = runKeys.latestOfThread(run?.thread_id ?? '')
      await queryClient.invalidateQueries({ queryKey })
      const latest = queryClient.getQueryData<Run | null>(queryKey)
      if (!isClosed() && latest != null) await onReloaded(latest)
    },
  })

  useCoalescedListener(key, {
    listen: listenAfterLoaded,
    isWanted: (signal) => signal.kind === 'event' && isOneOf(runCostEvents, signal.event.type),
    task: () => queryClient.invalidateQueries({ predicate: hasCost }),
  })
}
