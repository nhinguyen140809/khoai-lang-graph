import { type RunEvent, runEventSchemas, type RunEventType } from './run-events.types'

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

export function isTerminal(type: RunEventType): boolean {
  return type === 'done' || type === 'error'
}
