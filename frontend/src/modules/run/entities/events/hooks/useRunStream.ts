import { useEffect, useReducer } from 'react'

import { runStreamUrl } from '../../runs/runs.api'
import {
  applyRunEvent,
  initialRunStreamState,
  isTerminal,
  parseRunEvent,
  type RunStreamState,
} from '../run-events.reducer'
import { runEventTypes } from '../run-events.types'

/**
 * Subscribes to the SSE stream of one run. EventSource reconnects on its own and sends
 * `Last-Event-ID`, so the server can replay missed events.
 * Mount one instance per run; state is not reset when `runId` changes.
 */
export function useRunStream(runId: string): RunStreamState {
  const [state, dispatch] = useReducer(applyRunEvent, initialRunStreamState)

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
