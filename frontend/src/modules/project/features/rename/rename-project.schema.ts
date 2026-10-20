import { z } from 'zod'

/** The form that renames a project; its field is named after the field of the request. */
export const renameProjectFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
})

export type RenameProjectForm = z.input<typeof renameProjectFormSchema>
