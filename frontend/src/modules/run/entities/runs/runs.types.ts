import { z } from 'zod'

import { runConfigSchema } from '../config/run-config.types'
import { runStatuses } from '../status/run-status.types'

// Temporary hand-written schemas for the runs API: the runs.
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

/**
 * The kinds of a short note that a step wrote while it worked: what it looked at (`doing`),
 * something the user may care about (`finding`), and a summary of the reasoning that the model
 * provider returned (`thinking`). The step carries the notes, and the stream sends each one.
 */
export const stepNoteKinds = ['doing', 'finding', 'thinking'] as const

export type StepNoteKind = (typeof stepNoteKinds)[number]

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

/** The codes that a failed run names in its error, from Runtime failures. */
export const runErrorCodes = [
  'provider_error',
  'step_limit_exceeded',
  'cost_limit_exceeded',
  'budget_exceeded',
  'timeout',
  'item_conflict',
  'server_restarted',
] as const

export type RunErrorCode = (typeof runErrorCodes)[number]
