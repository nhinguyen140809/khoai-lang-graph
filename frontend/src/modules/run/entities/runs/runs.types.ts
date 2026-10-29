import { z } from 'zod'

import { itemRefSchema } from '@/modules/artifact/entities/@x/run'

import { runConfigSchema } from '../config/run-config.types'
import { runStatuses } from '../status/run-status.types'

// Temporary hand-written schemas for the runs API: the runs and their steps.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The tokens, cost and time that a run or one of its steps used. */
export const runUsageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_tokens: z.number().int(),
  cache_write_tokens: z.number().int(),
  cost_usd: z.number(),
  duration_ms: z.number().int(),
})

export type RunUsage = z.infer<typeof runUsageSchema>

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
  run_config: runConfigSchema,
  retry_of_run_id: z.string().nullable(),
  error: z.object({ code: z.string(), message: z.string(), stage: z.string() }).nullable(),
  usage: runUsageSchema,
  trace_id: z.string().nullable(),
  /** Steps so far; also the sequence of the latest step. */
  step_count: z.number().int(),
  last_event_id: z.number().int(),
  started_at: z.iso.datetime().nullable(),
  finished_at: z.iso.datetime().nullable(),
})

export type Run = z.infer<typeof runSchema>

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
  usage: runUsageSchema,
  produced: z.array(itemRefSchema),
  error: z.string().nullable(),
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
})

export type RunStep = z.infer<typeof runStepSchema>

// The answer of the request that starts a run of a thread with an input.
export const createRunResponseSchema = z.object({ run_id: z.string() })

export type CreateRunResponse = z.infer<typeof createRunResponseSchema>
