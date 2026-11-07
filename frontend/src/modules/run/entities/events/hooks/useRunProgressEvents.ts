'use client'

import { isOneOf } from '@/shared/lib/guards'
import { useCoalescedListener } from '@/shared/lib/scheduling'

import type { Run } from '../../runs/runs.types'
import { isUnfinishedRunStatus } from '../../status/run-status.utils'
import { listenToRun } from '../run-event-channels.api'
import { runProgressEvents } from '../run-events.constants'
import type { RunChannelSignal } from '../run-events.types'

/**
 * Follows the events of an unfinished run after the last event it had when it loaded, and calls
 * `onChanged` after each event that changes what the run did (`runProgressEvents`); the calls of a
 * burst share one, and a connection that fails for good calls it too. Stops after `done`.
 */
export function useRunProgressEvents(
  run: Pick<Run, 'id' | 'status' | 'last_event_id'> | null | undefined,
  onChanged: () => Promise<void> | void,
): void {
  const runId = run?.id ?? null
  const isUnfinished = run != null && isUnfinishedRunStatus(run.status)

  useCoalescedListener<RunChannelSignal>(isUnfinished ? runId : null, {
    listen: (listener) =>
      listenToRun(run?.id ?? '', listener, { after: run?.last_event_id ?? null }),
    isWanted: (signal) => signal.kind === 'failed' || isOneOf(runProgressEvents, signal.event.type),
    task: () => onChanged(),
  })
}
