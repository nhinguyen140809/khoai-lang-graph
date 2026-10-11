'use client'

import { useEffect } from 'react'

import { useRefreshEventLog } from '../hooks/useConsoleActions'
import { useRunStream } from '../hooks/useRunStream'

interface RunWatcherProps {
  runId: string
}

/**
 * Follows the stream of an unfinished run and reads the event log again each time the run starts
 * a step, ends one, pauses or ends. It prints nothing itself: the log shows what the API lists.
 */
export function RunWatcher({ runId }: RunWatcherProps) {
  const run = useRunStream(runId)
  const refresh = useRefreshEventLog()
  // Tokens arrive many times a second; only the events that change the log are counted.
  const changes = run.entries.filter((entry) => entry.kind !== 'text').length
  const progress = `${run.status}:${String(changes)}`

  useEffect(() => {
    void refresh()
    // `refresh` is rebuilt on every render; the progress says when the log changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  return null
}
