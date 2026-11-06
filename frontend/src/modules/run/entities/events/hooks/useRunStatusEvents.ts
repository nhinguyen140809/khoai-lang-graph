'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent } from 'react'

import { hasCost } from '@/shared/api/query-client'
import { isOneOf } from '@/shared/lib/guards'
import { coalescedTask } from '@/shared/lib/scheduling'

import { runKeys } from '../../runs/runs.keys'
import type { Run } from '../../runs/runs.types'
import { isUnfinishedRunStatus } from '../../status/run-status.utils'
import { listenToRun } from '../run-event-channels.api'
import { runCostEvents, runStatusEvents } from '../run-events.constants'

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
  const reloaded = useEffectEvent(onReloaded)
  const runId = run?.id
  const threadId = run?.thread_id
  const isUnfinished = run != null && isUnfinishedRunStatus(run.status)

  useEffect(() => {
    if (runId === undefined || threadId === undefined || !isUnfinished) return
    const queryKey = runKeys.latestOfThread(threadId)
    // Read when the stream opens only: the run loads again at each event, with a later id.
    const lastEventId = queryClient.getQueryData<Run | null>(queryKey)?.last_event_id
    // Set once the cleanup stops the listening, so that a load still in progress reports nothing.
    let isClosed = false

    const reload = coalescedTask(async () => {
      await queryClient.invalidateQueries({ queryKey })
      const latest = queryClient.getQueryData<Run | null>(queryKey)
      if (!isClosed && latest != null) await reloaded(latest)
    })
    const reloadCosts = coalescedTask(() => queryClient.invalidateQueries({ predicate: hasCost }))
    const stop = listenToRun(
      runId,
      (signal) => {
        if (signal.kind === 'failed') {
          reload()
          return
        }
        if (!isOneOf(runStatusEvents, signal.event.type)) return
        reload()
        if (isOneOf(runCostEvents, signal.event.type)) reloadCosts()
      },
      { after: lastEventId ?? null },
    )
    return () => {
      isClosed = true
      stop()
    }
  }, [queryClient, runId, threadId, isUnfinished])
}
