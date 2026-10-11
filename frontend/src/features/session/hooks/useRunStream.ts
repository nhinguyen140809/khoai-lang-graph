import { useEffect, useReducer } from 'react'

import {
  applyRunEvent,
  initialRunState,
  isSession,
  parseRunEvent,
  type RunState,
} from '../run-events.reducer'
import { runStreamUrl } from '../session.api'
import { RUN_EVENT_TYPES } from '../session.types'

/**
 * Subscribes to the SSE stream of one run. EventSource reconnects on its own and sends
 * `Last-Event-ID`, so the server can replay missed events. Mount one instance per run; state is
 * not reset when `runId` changes.
 */
export function useRunStream(runId: string): RunState {
  const [state, dispatch] = useReducer(applyRunEvent, initialRunState)

  useEffect(() => {
    const source = new EventSource(runStreamUrl(runId))
    for (const type of RUN_EVENT_TYPES) {
      source.addEventListener(type, (message: MessageEvent<string>) => {
        const event = parseRunEvent(type, message.lastEventId, message.data)
        if (event) dispatch(event)
        if (isSession(type)) source.close()
      })
    }
    return () => {
      source.close()
    }
  }, [runId])

  return state
}
