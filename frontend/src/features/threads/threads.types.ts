import { z } from 'zod'

import { runStatuses, unfinishedRunStatuses } from '@/shared/config/run-status.constants'

// Temporary hand-written schemas for the threads and runs API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const threadSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  created_by: z.string(),
  /** Null until it is given, or generated from the first message. */
  title: z.string().nullable(),
  status: z.enum(['active', 'archived']),
  /** Stage of the latest run; null before the first run. */
  current_stage: z.string().nullable(),
  /** The unfinished run of the thread (queued, running or interrupted), if any. */
  active_run_id: z.string().nullable(),
  /** The status of `active_run_id`; null when the thread has no unfinished run. */
  active_run_status: z.enum(unfinishedRunStatuses).nullable(),
  last_message_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Thread = z.infer<typeof threadSchema>

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
  /** Order of the run in its thread, from 1: "Run 3". */
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
  /** Steps so far; also the sequence of the latest step. */
  step_count: z.number().int(),
  last_event_id: z.number().int(),
  started_at: z.iso.datetime().nullable(),
  finished_at: z.iso.datetime().nullable(),
})

export type Run = z.infer<typeof runSchema>

export const itemRefSchema = z.object({
  item_id: z.string(),
  kind: z.string(),
  key: z.string(),
  version: z.number().int(),
})

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
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
})

export type RunStep = z.infer<typeof runStepSchema>
