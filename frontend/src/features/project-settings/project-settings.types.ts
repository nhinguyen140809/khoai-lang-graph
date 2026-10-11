import { z } from 'zod'

// Temporary hand-written schemas for what the settings of a project read and write.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const outputLanguages = ['en', 'vi'] as const

export const outputLanguageLabels = { en: 'English', vi: 'Vietnamese' } as const satisfies Record<
  (typeof outputLanguages)[number],
  string
>

export const runConfigSchema = z.object({
  review_checkpoints: z.array(z.string()).nullable(),
  max_steps: z.number().int().nullable(),
  max_cost_usd: z.number().nullable(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

export type RunConfig = z.infer<typeof runConfigSchema>

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

/** One property of the schema of the run parameters. */
export const parameterSchemaSchema = z.looseObject({
  type: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
})

export type ParameterSchema = z.infer<typeof parameterSchemaSchema>

/** The parts of the workflow definition that the settings of a project need. */
export const settingsDefinitionSchema = z.looseObject({
  version: z.number().int(),
  nodes: z.array(z.looseObject({ id: z.string(), kind: z.string(), label: z.string() })),
  agent_roles: z.array(z.object({ key: z.string(), label: z.string(), description: z.string() })),
  run_parameters_schema: z.looseObject({
    properties: z.record(z.string(), parameterSchemaSchema),
  }),
})

export type SettingsDefinition = z.infer<typeof settingsDefinitionSchema>

export const modelEntrySchema = z.looseObject({
  model_id: z.string(),
  provider: z.string(),
  display_name: z.string(),
  allowed_roles: z.array(z.string()),
})

export type ModelEntry = z.infer<typeof modelEntrySchema>

export const sections = ['general', 'runs', 'models'] as const

export type Section = (typeof sections)[number]

export const sectionLabels = {
  general: 'General',
  runs: 'Runs',
  models: 'Models',
} as const satisfies Record<Section, string>
