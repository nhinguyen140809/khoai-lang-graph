import { z } from 'zod'

import { runStatuses } from '@/lib/run-status.constants'

// Temporary hand-written schemas for the workflow API; a feature keeps its
// own, so it never imports another one. TODO: replace with the generated
// types in src/api/generated/ once they exist.

const isoDatetime = z.iso.datetime()

/** Just what the Workflow tab reads of a thread: the conversation's id. */
export const threadIdSchema = z.object({ id: z.string() })

export const usageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_tokens: z.number().int(),
  cache_write_tokens: z.number().int(),
  cost_usd: z.number(),
  duration_ms: z.number().int(),
})
export type Usage = z.infer<typeof usageSchema>

export const runSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  project_id: z.string(),
  number: z.number().int(),
  started_by: z.string(),
  workflow_name: z.string(),
  workflow_version: z.number().int(),
  status: z.enum(runStatuses),
  current_stage: z.string(),
  iteration_count: z.number().int(),
  run_config: z.object({
    models: z.record(z.string(), z.string()),
    review_checkpoints: z.array(z.string()),
    output_language: z.enum(['en', 'vi']),
    max_steps: z.number().int(),
    max_cost_usd: z.number().nullable(),
    parameters: z.record(z.string(), z.unknown()),
  }),
  retry_of_run_id: z.string().nullable(),
  error: z.object({ code: z.string(), message: z.string(), stage: z.string() }).nullable(),
  usage: usageSchema,
  trace_id: z.string().nullable(),
  step_count: z.number().int(),
  last_event_id: z.number().int(),
  started_at: isoDatetime.nullable(),
  finished_at: isoDatetime.nullable(),
})
export type Run = z.infer<typeof runSchema>

export const itemRefSchema = z.object({
  item_id: z.string(),
  kind: z.string(),
  key: z.string(),
  version: z.number().int(),
})
export type ItemRef = z.infer<typeof itemRefSchema>

export const runStepSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  sequence: z.number().int(),
  node: z.string(),
  agent_role: z.string().nullable(),
  stage: z.string(),
  status: z.enum(['running', 'succeeded', 'failed', 'skipped']),
  iteration: z.number().int(),
  subject_item_id: z.string().nullable(),
  model_id: z.string().nullable(),
  llm_calls: z.number().int(),
  usage: usageSchema,
  produced: z.array(itemRefSchema),
  error: z.string().nullable(),
  started_at: isoDatetime,
  finished_at: isoDatetime.nullable(),
})
export type RunStep = z.infer<typeof runStepSchema>
