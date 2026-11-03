import { z } from 'zod'

import { outputLanguages } from '@/shared/config/output-language'

// Temporary hand-written schemas of the settings of the runs.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** Settings that runs start from; a field left empty takes the value of the next level. */
export const runDefaultsSchema = z.object({
  review_checkpoints: z.array(z.string()).nullable(),
  max_steps: z.number().int().nullable(),
  max_cost_usd: z.number().nullable(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

export type RunDefaults = z.infer<typeof runDefaultsSchema>

/**
 * The settings that a run uses, every field set when the run starts, and kept as they were then:
 * a later change of the settings leaves the past runs as they ran.
 */
export const runConfigSchema = z.object({
  /** By agent role, the model that it uses (`provider:model`). */
  models: z.record(z.string(), z.string()),
  /** The checkpoints that wait for the user; any other continues with its default answers. */
  review_checkpoints: z.array(z.string()),
  output_language: z.enum(outputLanguages),
  max_steps: z.number().int(),
  /** Null for no limit. */
  max_cost_usd: z.number().nullable(),
  /** The limits of the workflow, as the version of its definition names them. */
  parameters: z.record(z.string(), z.unknown()),
})

export type RunConfig = z.infer<typeof runConfigSchema>
