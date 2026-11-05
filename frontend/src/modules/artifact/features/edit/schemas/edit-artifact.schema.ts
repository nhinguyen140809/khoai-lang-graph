import { z } from 'zod'

import type { ContentField } from '@/modules/workflow/entities'
import { contentFormValuesSchema, withContentProblems } from '@/modules/workflow/entities'

/** The values of the form that edits an artifact: its title, its summary and its content fields. */
export interface EditArtifactFormValues {
  title: string
  summary: string
  content: z.input<typeof contentFormValuesSchema>['content']
}

/**
 * The schema of the form that edits an artifact: a required title, a summary (empty is stored as
 * null), and the content fields of the schema of its kind, each checked where the API names its
 * problems.
 */
export function editArtifactFormSchema(fields: readonly ContentField[]) {
  return withContentProblems(
    z.object({
      title: z.string().trim().min(1, 'Enter a title.'),
      summary: z.string(),
      content: contentFormValuesSchema.shape.content,
    }),
    fields,
  )
}
