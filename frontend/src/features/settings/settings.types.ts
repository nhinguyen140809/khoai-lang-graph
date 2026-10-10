import { z } from 'zod'

// Temporary hand-written schemas for the settings API.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const userSettingsSchema = z.object({
  user_id: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  ui_language: z.enum(['en', 'vi']),
  default_output_language: z.enum(['en', 'vi']),
  /** Used for every field that a project leaves empty. */
  default_run_config: z.object({
    review_checkpoints: z.array(z.string()).nullable(),
    max_steps: z.number().int().nullable(),
    max_cost_usd: z.number().nullable(),
    parameters: z.record(z.string(), z.unknown()).nullable(),
  }),
  notify_on_interrupt: z.boolean(),
  notify_on_run_finished: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type UserSettings = z.infer<typeof userSettingsSchema>
