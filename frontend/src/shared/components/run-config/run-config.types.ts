import { z } from 'zod'

/** The settings that runs start from; a field left empty takes the value of the next level. */
export const runConfigSchema = z.object({
  review_checkpoints: z.array(z.string()).nullable(),
  max_steps: z.number().int().nullable(),
  max_cost_usd: z.number().nullable(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

export type RunConfig = z.infer<typeof runConfigSchema>

/** One property of the schema of the run parameters. */
export const parameterSchemaSchema = z.looseObject({
  type: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
})

export type ParameterSchema = z.infer<typeof parameterSchemaSchema>

/** The parts of the workflow definition that a form of run settings needs. */
export const runConfigDefinitionSchema = z.looseObject({
  version: z.number().int(),
  nodes: z.array(z.looseObject({ id: z.string(), kind: z.string(), label: z.string() })),
  agent_roles: z.array(z.object({ key: z.string(), label: z.string(), description: z.string() })),
  run_parameters_schema: z.looseObject({
    properties: z.record(z.string(), parameterSchemaSchema),
  }),
})

export type RunConfigDefinition = z.infer<typeof runConfigDefinitionSchema>
