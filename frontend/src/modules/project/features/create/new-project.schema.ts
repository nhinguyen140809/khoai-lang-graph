import { z } from 'zod'

import { runDefaultsFieldsSchema } from '@/modules/run/entities'
import type { RunParameterField } from '@/modules/workflow/entities'
import { outputLanguages } from '@/shared/config/output-language'

// The form that creates a project and sends its idea. Its project fields are named after the
// fields of the request that creates the project, and its run settings after those of RunDefaults.

/** The schema of the form, given the fields of the run parameters of the workflow. */
export function newProjectFormSchemaOf(parameterFields: RunParameterField[]) {
  return z.object({
    /** Left blank, the agents name the project from its idea. */
    name: z
      .string()
      .trim()
      .transform((text) => (text === '' ? null : text)),
    output_language: z.enum(outputLanguages),
    /** The first message of the project, which starts its first run. */
    idea: z.string().trim().min(1, 'Describe the idea.'),
    /** The settings that the runs of the project start from; a field left empty is not set. */
    run_config: runDefaultsFieldsSchema(parameterFields),
  })
}

export type NewProjectFormSchema = ReturnType<typeof newProjectFormSchemaOf>

export type NewProjectForm = z.input<NewProjectFormSchema>

/** What the form gives on submit: the fields of the request, and the idea to send after it. */
export type NewProject = z.output<NewProjectFormSchema>
