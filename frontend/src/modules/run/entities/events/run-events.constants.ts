import type { RunEventType } from './run-events.types'

/**
 * The events of a run after which what it did may differ: the work of a step, a note of a step, a
 * review, a message taken in, a failure and the end. The others, such as the text that a step writes, leave it as
 * it is.
 */
export const runProgressEvents = [
  'node_start',
  'node_end',
  'step_note',
  'interrupt',
  'message_delivered',
  'error',
  'done',
] as const satisfies readonly RunEventType[]

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

/**
 * The events of a run after which its cost may differ: a step that ends, a failure and the end of
 * the run.
 */
export const runCostEvents = [
  'node_end',
  'error',
  'done',
] as const satisfies readonly (typeof runStatusEvents)[number][]

/** How long a stream waits before it opens again after its connection failed, in milliseconds. */
export const streamReopenMs = 5_000

/** The events that change which artifacts the node in progress writes. */
export const artifactProgressEvents = [
  ...runStatusEvents,
  'artifact_created',
  'artifact_delta',
] as const satisfies readonly RunEventType[]

/**
 * The events after which the artifacts of the project may differ: an artifact that is created, and
 * a node that ends, which may have changed the ones it wrote.
 */
export const artifactWrittenEvents = [
  'artifact_created',
  'node_end',
] as const satisfies readonly (typeof artifactProgressEvents)[number][]
