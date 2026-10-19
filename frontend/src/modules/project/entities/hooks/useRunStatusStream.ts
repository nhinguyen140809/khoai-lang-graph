import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  isUnfinishedRunStatus,
  type Run,
  runEventsUrl,
  runKeys,
} from '@/modules/run/entities/@x/project'
import { type Thread, threadKeys } from '@/modules/thread/entities/@x/project'
import { holdsCost } from '@/shared/api/query-meta.utils'
import { coalescedTask } from '@/shared/lib/coalesced-task.utils'

import {
  COST_EVENTS,
  RUN_STATUS_EVENTS,
  STREAM_REOPEN_MS,
} from '../constants/run-status-stream.constants'

// The events after which a cost may differ, to tell them from the other events of the stream.
const costEvents: ReadonlySet<string> = new Set(COST_EVENTS)

/**
 * Follows the event stream of the latest run of a thread while the run is unfinished, and loads
 * the run again at each event that may change its status, its stage or its cost; the threads of
 * its project load again when the status of the run changes, and an event that changes a cost
 * also loads again every query that holds a cost. The events of a burst share one load, and an
 * event that comes during a load is followed by one more, since the load that started before it
 * may answer without its change. The stream starts after the latest event that the run had when
 * it loaded, and is closed after `done`, so that it does not connect again; the browser
 * reconnects with the last event it read. A stream whose connection fails for good opens again a
 * moment later.
 */
export function useRunStatusStream(
  run: Pick<Run, 'id' | 'thread_id' | 'project_id' | 'status'> | null | undefined,
) {
  const queryClient = useQueryClient()
  // Counts the streams opened again, so that a failed stream opens with the latest event read.
  const [reopened, setReopened] = useState(0)
  const runId = run?.id
  const threadId = run?.thread_id
  const projectId = run?.project_id
  const unfinished = run != null && isUnfinishedRunStatus(run.status)

  useEffect(() => {
    if (runId === undefined || threadId === undefined || projectId === undefined || !unfinished) {
      return
    }
    const queryKey = runKeys.latestRun(threadId)
    // Read when the stream opens only: the run loads again at each event, with a later id.
    const after = queryClient.getQueryData<Run | null>(queryKey)?.last_event_id ?? 0
    const source = new EventSource(runEventsUrl(runId, after))
    let reopen: ReturnType<typeof setTimeout> | undefined

    const threadsKey = threadKeys.ofProject(projectId)
    // The threads hold the status of their latest runs, which the status of the project reads.
    // They load again only when the run that just loaded has a status that its thread does not
    // show yet: when the run starts, waits for a review, goes on after it, or ends.
    const reload = coalescedTask(async () => {
      await queryClient.invalidateQueries({ queryKey })
      const status = queryClient.getQueryData<Run | null>(queryKey)?.status
      const threads = queryClient.getQueryData<Thread[]>(threadsKey)
      const shown = threads?.find(({ id }) => id === threadId)?.latest_run_status
      if (status !== undefined && threads !== undefined && shown !== status) {
        await queryClient.invalidateQueries({ queryKey: threadsKey })
      }
    })
    const reloadCosts = coalescedTask(() => queryClient.invalidateQueries({ predicate: holdsCost }))
    for (const type of RUN_STATUS_EVENTS) {
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
      }, STREAM_REOPEN_MS)
    })

    return () => {
      clearTimeout(reopen)
      source.close()
    }
  }, [queryClient, runId, threadId, projectId, unfinished, reopened])
}
