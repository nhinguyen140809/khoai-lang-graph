import { z } from 'zod'

import { outputLanguages } from '@/shared/config/output-language'

// The form that creates a project and sends its idea. Its project fields are named after the
// fields of the request that creates the project.

export const newProjectFormSchema = z.object({
  /** Left blank, the agents name the project from its idea. */
  name: z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : text)),
  output_language: z.enum(outputLanguages),
  /** The first message of the project, which starts its first run. */
  idea: z.string().trim().min(1, 'Describe the idea.'),
})

export type NewProjectForm = z.input<typeof newProjectFormSchema>

/** What the form gives on submit: the fields of the request, and the idea to send after it. */
export type NewProject = z.output<typeof newProjectFormSchema>
