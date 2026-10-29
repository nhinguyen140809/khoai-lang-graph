import { z } from 'zod'

// Temporary hand-written schema for the state of a run.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/**
 * The workflow state of a run, as it was after a step, or now when `step_id` is null. `values`
 * follows the state schema of the definition that the run ran with, so it holds the names that
 * schema lists.
 */
export const runStateSchema = z.object({
  run_id: z.string(),
  step_id: z.string().nullable(),
  workflow_version: z.number().int(),
  values: z.record(z.string(), z.unknown()),
})

export type RunState = z.infer<typeof runStateSchema>
