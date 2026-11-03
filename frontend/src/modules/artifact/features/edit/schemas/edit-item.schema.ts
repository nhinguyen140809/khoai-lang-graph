import type { z } from 'zod'

import type { ContentField } from '@/modules/workflow/entities'
import { contentFormValuesSchema, withContentProblems } from '@/modules/workflow/entities'

/** The values of the form that edits an item: its content fields sit under `content`. */
export type EditItemFormValues = z.input<ReturnType<typeof editItemFormSchema>>

/** The schema of the form that edits an item, against the fields of the schema of its kind. */
export function editItemFormSchema(fields: readonly ContentField[]) {
  return withContentProblems(contentFormValuesSchema, fields)
}
