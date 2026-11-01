import { z } from 'zod'

import { outputLanguageSchema } from './projects.types'

// The form that creates a project. Its fields are named after the fields of the request, and the
// value of the schema is the body of the request.

export const newProjectFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
  description: z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : text)),
  output_language: outputLanguageSchema,
})

export type NewProjectForm = z.input<typeof newProjectFormSchema>
