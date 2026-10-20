import { useEffect, useReducer } from 'react'

import {
  applyRunEvent,
  initialRunState,
  isTerminal,
  parseRunEvent,
  type RunState,
} from '../run-events.reducer'
import { runStreamUrl } from '../runs.api'
import { runEventTypes } from '../types/run-events.types'

/**
 * Subscribes to the SSE stream of one run. EventSource reconnects on its own and sends
 * `Last-Event-ID`, so the server can replay missed events.
 * Mount one instance per run; state is not reset when `runId` changes.
 */
export function useRunStream(runId: string): RunState {
  const [state, dispatch] = useReducer(applyRunEvent, initialRunState)

  useEffect(() => {
    const source = new EventSource(runStreamUrl(runId))
    for (const type of runEventTypes) {
      source.addEventListener(type, (message: MessageEvent<string>) => {
        const event = parseRunEvent(type, message.lastEventId, message.data)
        if (event) dispatch(event)
        if (isTerminal(type)) source.close()
      })
    }
    return () => {
      source.close()
    }
  }, [runId])

  return state
}
