import { z } from 'zod'

import { runUsageSchema } from '../runs/runs.types'

// Temporary hand-written schemas for the run event stream. Payload fields are provisional.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.
export const runEventSchemas = {
  node_start: z.object({
    node: z.string(),
    step_id: z.string(),
    agent_role: z.string().nullable(),
    stage: z.string(),
    iteration: z.number().int(),
    persona_key: z.string().nullable(),
  }),
  node_end: z.object({
    node: z.string(),
    step_id: z.string(),
    status: z.enum(['succeeded', 'failed', 'skipped']),
    usage: runUsageSchema,
  }),
  token: z.object({ node: z.string(), text: z.string(), step_id: z.string() }),
  tool_call: z.object({
    node: z.string(),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
    step_id: z.string(),
  }),
  artifact_created: z.object({
    artifact_id: z.string(),
    name: z.string(),
    version: z.number().int(),
    kind: z.string(),
  }),
  artifact_delta: z.object({
    artifact_id: z.string(),
    delta: z.string(),
    version: z.number().int(),
    item_id: z.string().nullable(),
    item_key: z.string().nullable(),
    change: z.enum(['item_created', 'item_updated', 'item_deleted', 'artifact_updated']),
  }),
  message_delivered: z.object({ message_id: z.string(), step_id: z.string(), node: z.string() }),
  project_named: z.object({ step_id: z.string(), project_id: z.string(), name: z.string() }),
  // `payload` stays unknown: `run` cannot read the schemas of `review`, so the activity reloads
  // the interrupts instead of reading it.
  interrupt: z.object({ node: z.string(), step_id: z.string(), payload: z.unknown() }),
  error: z.object({ message: z.string(), code: z.string(), stage: z.string() }),
  done: z.object({ status: z.enum(['succeeded', 'failed', 'cancelled']) }),
}

export type RunEventType = keyof typeof runEventSchemas

export const runEventTypes = Object.keys(runEventSchemas) as RunEventType[]

export type RunEvent = {
  [K in RunEventType]: { type: K; id: string; data: z.infer<(typeof runEventSchemas)[K]> }
}[RunEventType]

/** What a channel of a run tells its listeners: an event of the run, or that its connection failed for good. */
export type RunChannelSignal = { kind: 'event'; event: RunEvent } | { kind: 'failed' }
