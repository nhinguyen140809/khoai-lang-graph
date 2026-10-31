import { z } from 'zod'

import { runDefaultsSchema } from '@/modules/run/entities/@x/user'
import { outputLanguages } from '@/shared/config/output-language'

// Temporary hand-written schemas for the settings API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The themes that the user may choose; `system` follows the device. */
export const themes = ['light', 'dark', 'system'] as const
export type Theme = (typeof themes)[number]

/** The languages of the screens. */
export const uiLanguages = ['en', 'vi'] as const
export type UiLanguage = (typeof uiLanguages)[number]

/** The preferences of the user, one record for each user, the same on every device. */
export const userSettingsSchema = z.object({
  user_id: z.string(),
  theme: z.enum(themes),
  ui_language: z.enum(uiLanguages),
  /** The language of the documents of a new project. */
  default_output_language: z.enum(outputLanguages),
  /** The run settings for every field that a project leaves empty. */
  default_run_config: runDefaultsSchema,
  /** Notify when a run waits for review. */
  notify_on_interrupt: z.boolean(),
  notify_on_run_finished: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type UserSettings = z.infer<typeof userSettingsSchema>

/** The settings to change; a field left out keeps its value. */
export type ReplaceUserSettingsBody = Partial<
  Pick<
    UserSettings,
    | 'theme'
    | 'ui_language'
    | 'default_output_language'
    | 'default_run_config'
    | 'notify_on_interrupt'
    | 'notify_on_run_finished'
  >
>
