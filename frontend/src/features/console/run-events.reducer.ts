import { type RunEvent, runEventSchemas, type RunEventType, type RunStatus } from './console.types'

/**
 * One line of the log of a run, as the console prints it: a node when it starts, the entries it
 * produces, and the marks the run ends with.
 */
export type RunLogEntry =
  /** A node of the workflow, running until its `node_end`. */
  | { kind: 'node'; id: string; node: string; state: 'running' | 'finished' }
  /** The text one node wrote; its tokens are kept in one entry. */
  | { kind: 'text'; id: string; node: string; text: string }
  | { kind: 'tool_call'; id: string; node: string; tool: string }
  | { kind: 'artifact'; id: string; name: string; version: number }
  | { kind: 'interrupt'; id: string; node: string }
  | { kind: 'error'; id: string; message: string }
  | { kind: 'done'; id: string }

export interface RunState {
  status: RunStatus
  activeNode: string | null
  entries: RunLogEntry[]
  error: string | null
  lastEventId: string | null
}

export const initialRunState: RunState = {
  status: 'streaming',
  activeNode: null,
  entries: [],
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

/** Marks the entry of `node` that says it is still running as finished. */
function closeNode(entries: RunLogEntry[], node: string | null): RunLogEntry[] {
  if (node === null) return entries
  const index = entries.findLastIndex(
    (entry) => entry.kind === 'node' && entry.node === node && entry.state === 'running',
  )
  const entry = entries[index]
  if (index === -1 || entry?.kind !== 'node') return entries
  return entries.toSpliced(index, 1, { ...entry, state: 'finished' })
}

/** Appends `text` to the last text entry of `node`, or starts one. */
function appendText(entries: RunLogEntry[], id: string, node: string, text: string): RunLogEntry[] {
  const index = entries.findLastIndex((entry) => entry.kind === 'text' && entry.node === node)
  const entry = entries[index]
  if (index === -1 || entry?.kind !== 'text') {
    return [...entries, { kind: 'text', id, node, text }]
  }
  return entries.toSpliced(index, 1, { ...entry, text: entry.text + text })
}

export function applyRunEvent(state: RunState, event: RunEvent): RunState {
  const next = { ...state, lastEventId: event.id }
  switch (event.type) {
    case 'node_start':
      return {
        ...next,
        activeNode: event.data.node,
        entries: [
          ...state.entries,
          { kind: 'node', id: event.id, node: event.data.node, state: 'running' },
        ],
      }
    case 'node_end':
      return { ...next, activeNode: null, entries: closeNode(state.entries, event.data.node) }
    case 'token':
      return {
        ...next,
        entries: appendText(state.entries, event.id, event.data.node, event.data.text),
      }
    case 'tool_call':
      return {
        ...next,
        entries: [
          ...state.entries,
          { kind: 'tool_call', id: event.id, node: event.data.node, tool: event.data.tool },
        ],
      }
    case 'artifact_created':
      return {
        ...next,
        entries: [
          ...state.entries,
          {
            kind: 'artifact',
            id: event.id,
            name: event.data.name,
            version: event.data.version,
          },
        ],
      }
    case 'interrupt':
      return {
        ...next,
        status: 'interrupted',
        activeNode: null,
        entries: [
          ...closeNode(state.entries, state.activeNode),
          { kind: 'interrupt', id: event.id, node: event.data.node },
        ],
      }
    case 'error':
      return {
        ...next,
        status: 'failed',
        activeNode: null,
        error: event.data.message,
        entries: [
          ...closeNode(state.entries, state.activeNode),
          { kind: 'error', id: event.id, message: event.data.message },
        ],
      }
    case 'done':
      return {
        ...next,
        status: 'succeeded',
        activeNode: null,
        entries: [...closeNode(state.entries, state.activeNode), { kind: 'done', id: event.id }],
      }
    case 'artifact_delta':
    case 'message_delivered':
      // Neither prints a line by itself: the log reads the delivery from the messages.
      return next
  }
}

export function isConsole(type: RunEventType): boolean {
  return type === 'done' || type === 'error'
}
