'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useState } from 'react'

import { hasCost } from '@/shared/api/query-client'
import { coalescedTask } from '@/shared/lib/timing'

import { runKeys } from '../../runs/runs.keys'
import type { Run } from '../../runs/runs.types'
import { isUnfinishedRunStatus } from '../../status/run-status.utils'
import { runEventsUrl } from '../run-events.api'
import { runCostEvents, runStatusEvents, streamReopenMs } from '../run-events.constants'

const costEvents: ReadonlySet<string> = new Set(runCostEvents)

/**
 * Follows the event stream of an unfinished run and loads the run again at each event that may
 * change its status or its stage, then calls `onReloaded` with it. The events of a burst share one
 * load, and an event that comes during a load is followed by one more, since the load that started
 * before it may answer without its change. An event that may change a cost also loads again every
 * query that holds a cost, and the events of a burst share that load too. The stream starts after the latest event that the run
 * had when it loaded, and is closed after `done`, so that it does not connect again; the browser
 * reconnects with the last event it read. A stream whose connection fails for good opens again a
 * moment later.
 */
export function useRunStatusEvents(
  run: Pick<Run, 'id' | 'thread_id' | 'status'> | null | undefined,
  onReloaded: (run: Run) => Promise<void> | void,
) {
  const queryClient = useQueryClient()
  // Counts the streams opened again, so that a failed stream opens with the latest event read.
  const [reopened, setReopened] = useState(0)
  const reloaded = useEffectEvent(onReloaded)
  const runId = run?.id
  const threadId = run?.thread_id
  const isUnfinished = run != null && isUnfinishedRunStatus(run.status)

  useEffect(() => {
    if (runId === undefined || threadId === undefined || !isUnfinished) return
    const queryKey = runKeys.latestOfThread(threadId)
    // Read when the stream opens only: the run loads again at each event, with a later id.
    const lastEventId = queryClient.getQueryData<Run | null>(queryKey)?.last_event_id
    const source = new EventSource(
      runEventsUrl(runId, lastEventId === undefined ? null : String(lastEventId)),
    )
    let reopen: ReturnType<typeof setTimeout> | undefined
    // Set once the stream is closed by the cleanup, so that a load still in progress reports nothing.
    let isClosed = false

    const reload = coalescedTask(async () => {
      await queryClient.invalidateQueries({ queryKey })
      const latest = queryClient.getQueryData<Run | null>(queryKey)
      if (!isClosed && latest != null) await reloaded(latest)
    })
    const reloadCosts = coalescedTask(() => queryClient.invalidateQueries({ predicate: hasCost }))
    for (const type of runStatusEvents) {
      source.addEventListener(type, (event) => {
        // The connection reports its own failures as `error` too, without the data of an event.
        if (!(event instanceof MessageEvent)) return
        reload()
        if (costEvents.has(type)) reloadCosts()
      })
    }
    source.addEventListener('done', () => {
      source.close()
    })
    // A connection that failed for good, such as on an error status, does not connect again.
    source.addEventListener('error', () => {
      if (source.readyState !== EventSource.CLOSED) return
      reload()
      reopen = setTimeout(() => {
        setReopened((count) => count + 1)
      }, streamReopenMs)
    })

    return () => {
      isClosed = true
      clearTimeout(reopen)
      source.close()
    }
  }, [queryClient, runId, threadId, isUnfinished, reopened])
}
