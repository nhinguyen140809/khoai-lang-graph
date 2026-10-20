import type { RunEventType } from '../types/run-events.types'

/**
 * The events of a run after which its status, its stage or its cost may differ; the others, such
 * as the text that a step writes, leave them as they are.
 */
export const runStatusEvents = [
  'node_start',
  'node_end',
  'interrupt',
  'error',
  'done',
] as const satisfies readonly RunEventType[]

/** The events of a run after which a cost may differ: a step that ends, and the run that ends. */
export const runCostEvents = [
  'node_end',
  'error',
  'done',
] as const satisfies readonly (typeof runStatusEvents)[number][]
