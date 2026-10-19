import {
  type RunEvent,
  runEventSchemas,
  type RunEventType,
  type RunStreamStatus,
} from './types/run-events.types'

export interface RunState {
  status: RunStreamStatus
  activeNode: string | null
  text: string
  error: string | null
  lastEventId: string | null
}

export const initialRunState: RunState = {
  status: 'streaming',
  activeNode: null,
  text: '',
  error: null,
  lastEventId: null,
}

/** Parses one SSE message into a typed run event; returns null for malformed payloads. */
export function parseRunEvent(type: RunEventType, id: string, raw: string): RunEvent | null {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return null
  }
  const result = runEventSchemas[type].safeParse(json)
  return result.success ? ({ type, id, data: result.data } as RunEvent) : null
}

/**
 * The state of the run after one event. An event whose id is not after the last one applied is
 * left out: a stream that replays from too early sends events again, and the text of a token
 * applied twice would show twice.
 */
export function applyRunEvent(state: RunState, event: RunEvent): RunState {
  if (state.lastEventId !== null && Number(event.id) <= Number(state.lastEventId)) return state
  const next = { ...state, lastEventId: event.id }
  switch (event.type) {
    case 'node_start':
      return { ...next, activeNode: event.data.node }
    case 'node_end':
      return { ...next, activeNode: null }
    case 'token':
      return { ...next, text: state.text + event.data.text }
    case 'interrupt':
      return { ...next, status: 'interrupted' }
    case 'error':
      return { ...next, status: 'failed', activeNode: null, error: event.data.message }
    case 'done':
      return { ...next, status: 'succeeded', activeNode: null }
    case 'tool_call':
    case 'artifact_created':
    case 'artifact_delta':
      // Consumed by the workflow and artifact panels once they exist.
      return next
  }
}

export function isTerminal(type: RunEventType): boolean {
  return type === 'done' || type === 'error'
}
