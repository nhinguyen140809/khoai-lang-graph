import { useEffect, useReducer } from 'react'

import { listenToRun } from '../run-event-channels.api'
import { applyRunEvent, initialRunStreamState, type RunStreamState } from '../run-events.reducer'

/**
 * Follows the events of one run from its first event and folds them into a state. The stream is
 * shared with the other parts of the app that follow the run, and EventSource reconnects on its
 * own with the last event read.
 * Mount one instance per run; state is not reset when `runId` changes.
 */
export function useRunStream(runId: string): RunStreamState {
  const [state, dispatch] = useReducer(applyRunEvent, initialRunStreamState)

  useEffect(
    () =>
      listenToRun(runId, (signal) => {
        if (signal.kind === 'event') dispatch(signal.event)
      }),
    [runId],
  )

  return state
}
