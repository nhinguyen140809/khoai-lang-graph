import type { RunEventType } from './run-events.types'

/**
 * The events of a run after which its status or its stage may differ; the others, such as the
 * text that a step writes, leave them as they are.
 */
export const runStatusEvents = [
  'node_start',
  'node_end',
  'interrupt',
  'error',
  'done',
] as const satisfies readonly RunEventType[]

/** How long a stream waits before it opens again after its connection failed, in milliseconds. */
export const streamReopenMs = 5_000
