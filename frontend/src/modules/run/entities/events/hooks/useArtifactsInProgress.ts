'use client'

import { useState } from 'react'

import { isOneOf } from '@/shared/lib/guards'
import { useCoalescedListener } from '@/shared/lib/scheduling'

import type { Run } from '../../runs/runs.types'
import { artifactsInProgress } from '../artifacts-in-progress.utils'
import { listenToRun } from '../run-event-channels.api'
import { artifactProgressEvents, artifactWrittenEvents } from '../run-events.constants'
import type { RunChannelSignal } from '../run-events.types'

const noArtifacts: ReadonlySet<string> = new Set()

/**
 * Follows the events of a running run from its first event and gives the artifacts that the node
 * in progress writes. Calls `onWritten` after an artifact is created and after a node ends; the
 * calls of a burst share one. Listens only while the run is running.
 */
export function useArtifactsInProgress(
  run: Pick<Run, 'id' | 'status'> | null | undefined,
  onWritten: () => Promise<void> | void,
): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(noArtifacts)
  const runId = run?.id ?? null
  const isRunning = run?.status === 'running'

  useCoalescedListener<RunChannelSignal>(isRunning ? runId : null, {
    listen: (listener) => listenToRun(run?.id ?? '', listener),
    isWanted: (signal) =>
      signal.kind === 'event' && isOneOf(artifactWrittenEvents, signal.event.type),
    onSignal: (signal) => {
      if (signal.kind !== 'event' || !isOneOf(artifactProgressEvents, signal.event.type)) return
      setIds((current) => artifactsInProgress(current, signal.event))
    },
    task: () => onWritten(),
  })

  return isRunning ? ids : noArtifacts
}
