import { z } from 'zod'

import { type FieldView, toStoredContent, validateContent } from './field-view.utils'

/**
 * The edit form of an item, with one field for each editable field of its content, checked against
 * the schema of its kind. Its value is the content to store.
 */
export function itemFormSchema(views: FieldView[]) {
  const editable = views.filter((view) => !view.readOnly)
  return z
    .object(Object.fromEntries(editable.map((view) => [view.name, z.unknown()])))
    .superRefine((content, context) => {
      for (const [name, message] of Object.entries(validateContent(editable, content))) {
        context.addIssue({ code: 'custom', message, path: [name] })
      }
    })
    .transform((content) => toStoredContent(editable, content))
}

export type ItemForm = z.input<ReturnType<typeof itemFormSchema>>

/** The export of the artifacts: a template and one of its formats. Its value is the body of the request. */
export const exportFormSchema = z.object({
  template: z.string().min(1, 'Choose a template.'),
  format: z.string().min(1, 'Choose a format.'),
})

export type ExportForm = z.input<typeof exportFormSchema>
