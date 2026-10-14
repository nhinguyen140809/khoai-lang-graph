import { z } from 'zod'

import { runConfigSchema } from '@/shared/components/run-config'
import { type ProjectSettingsSection, projectSettingsSections } from '@/shared/config/routes'

// Temporary hand-written schemas for what the settings of a project read and write.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const outputLanguages = ['en', 'vi'] as const

export const outputLanguageLabels = { en: 'English', vi: 'Vietnamese' } as const satisfies Record<
  (typeof outputLanguages)[number],
  string
>

export const settingsProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['active', 'archived']),
  output_language: z.enum(outputLanguages),
  run_config: runConfigSchema,
  model_overrides: z.record(z.string(), z.string()),
})

export type SettingsProject = z.infer<typeof settingsProjectSchema>

/** What may be sent to change a project; a field that is left out stays as it is. */
export type ProjectPatch = Partial<
  Pick<
    SettingsProject,
    'name' | 'description' | 'status' | 'output_language' | 'run_config' | 'model_overrides'
  >
>

export const modelEntrySchema = z.looseObject({
  model_id: z.string(),
  provider: z.string(),
  display_name: z.string(),
  allowed_roles: z.array(z.string()),
})

export type ModelEntry = z.infer<typeof modelEntrySchema>

export const sections = projectSettingsSections

export type Section = ProjectSettingsSection

export const sectionLabels = {
  general: 'General',
  runs: 'Runs',
  models: 'Models',
} as const satisfies Record<Section, string>
