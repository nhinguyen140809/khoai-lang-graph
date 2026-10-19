// The stream of the events of a run that the status of a project follows.

/**
 * The events of a run after which its status, its stage or its cost may differ; the others, such
 * as the text that a step writes, leave them as they are.
 */
export const RUN_STATUS_EVENTS = ['node_start', 'node_end', 'interrupt', 'error', 'done'] as const

/** The events of a run after which a cost may differ: a step that ends, and the run that ends. */
export const COST_EVENTS = [
  'node_end',
  'error',
  'done',
] as const satisfies readonly (typeof RUN_STATUS_EVENTS)[number][]

/** How long the status waits before it opens again a stream whose connection failed, in milliseconds. */
export const STREAM_REOPEN_MS = 5_000
