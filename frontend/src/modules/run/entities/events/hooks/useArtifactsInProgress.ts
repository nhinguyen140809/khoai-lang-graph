'use client'

import { useEffect, useEffectEvent, useState } from 'react'

import { isOneOf } from '@/shared/lib/guards'
import { coalescedTask } from '@/shared/lib/timing'

import type { Run } from '../../runs/runs.types'
import { artifactsInProgress } from '../artifacts-in-progress.utils'
import { listenToRun } from '../run-event-channels.api'
import { artifactProgressEvents, artifactWrittenEvents } from '../run-events.constants'

const noArtifacts: ReadonlySet<string> = new Set()

/**
 * Follows the events of a running run from its first event and gives the artifacts that the node
 * in progress writes. Calls `onWritten` after an artifact is created and after a node ends; the
 * calls of a burst share one. Listens only while the run is running; the cleanup sets `isClosed`
 * so that a reload in progress calls nothing.
 */
export function useArtifactsInProgress(
  run: Pick<Run, 'id' | 'status'> | null | undefined,
  onWritten: () => Promise<void> | void,
): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(noArtifacts)
  const written = useEffectEvent(onWritten)
  const runId = run?.id
  const isRunning = run?.status === 'running'

  useEffect(() => {
    if (runId === undefined || !isRunning) return
    // Set once the cleanup stops the listening, so that a reload in progress reports nothing.
    let isClosed = false
    const reload = coalescedTask(async () => {
      if (!isClosed) await written()
    })

    const stop = listenToRun(runId, (signal) => {
      if (signal.kind !== 'event' || !isOneOf(artifactProgressEvents, signal.event.type)) return
      setIds((current) => artifactsInProgress(current, signal.event))
      if (isOneOf(artifactWrittenEvents, signal.event.type)) reload()
    })
    return () => {
      isClosed = true
      stop()
    }
  }, [runId, isRunning])

  return isRunning ? ids : noArtifacts
}
