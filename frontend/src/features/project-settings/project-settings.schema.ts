import { z } from 'zod'

import { type ParameterField, runFormSchema } from '@/shared/components/run-config'

import { outputLanguages } from './project-settings.types'

// The forms of the settings of a project. Their fields are named after the fields of the request
// that changes a project, and the value of each schema is a part of that request.

export const generalFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
  description: z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : text)),
  output_language: z.enum(outputLanguages),
})

export type GeneralForm = z.input<typeof generalFormSchema>

/** The run settings of the project; a field left empty takes the value of the user. */
export function runsFormSchema(fields: ParameterField[]) {
  return z.object({ run_config: runFormSchema(fields) })
}

export type RunsForm = z.input<ReturnType<typeof runsFormSchema>>

/** The model of each agent role; a role left on '' takes the model of the user. */
export const modelsFormSchema = z
  .object({ model_overrides: z.record(z.string(), z.string()) })
  .transform(({ model_overrides }) => ({
    model_overrides: Object.fromEntries(
      Object.entries(model_overrides).filter(([, model]) => model !== ''),
    ),
  }))

export type ModelsForm = z.input<typeof modelsFormSchema>
