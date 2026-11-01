import { z } from 'zod'

// Temporary hand-written schemas for the projects API and the parts of other resources that the
// project list reads. TODO: replace with types generated into src/shared/api/generated/.

export const outputLanguages = ['en', 'vi'] as const

export const outputLanguageSchema = z.enum(outputLanguages)

export type OutputLanguage = z.infer<typeof outputLanguageSchema>

export const outputLanguageLabels = {
  en: 'English',
  vi: 'Vietnamese',
} as const satisfies Record<OutputLanguage, string>

export const projectStatusSchema = z.enum(['active', 'archived'])

export type ProjectStatus = z.infer<typeof projectStatusSchema>

/** Settings that runs start from; a field left empty takes the value of the next level. */
export const runDefaultsSchema = z.object({
  review_checkpoints: z.array(z.string()).nullable(),
  max_steps: z.number().int().nullable(),
  max_cost_usd: z.number().nullable(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

export type RunDefaults = z.infer<typeof runDefaultsSchema>

export const projectSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  output_language: outputLanguageSchema,
  run_config: runDefaultsSchema,
  initial_message_id: z.string().nullable(),
  model_overrides: z.record(z.string(), z.string()),
  /** Number of items per item kind. */
  item_counts: z.record(z.string(), z.number().int()),
  /** Number of unfinished runs per status; `interrupted` counts the reviews that wait. */
  unfinished_run_counts: z.object({
    queued: z.number().int(),
    running: z.number().int(),
    interrupted: z.number().int(),
  }),
  last_activity_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Project = z.infer<typeof projectSchema>

export type UnfinishedRunCounts = Project['unfinished_run_counts']

export interface CreateProjectBody {
  name: string
  description: string | null
  output_language: OutputLanguage
}

/** The user setting that the new project form starts from. */
export const projectDefaultsSchema = z.object({
  default_output_language: outputLanguageSchema,
})
