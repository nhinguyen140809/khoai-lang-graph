import { z } from 'zod'

import type { ContentField } from '../fields/content-fields.types'
import { type ContentValues, contentValuesSchema } from './content-values.types'
import { validateContent } from './content-values.utils'

/** The values of a form that edits a content: its fields sit under `content`, where the API names their problems. */
export interface ContentFormValues {
  content: ContentValues
}

/** The shape of a form of content, before the check of its fields. */
export const contentFormValuesSchema = z.object({ content: contentValuesSchema })

/**
 * The schema with the problems of `validateContent` added, each at `content.<field>`, so that a
 * form checks only the rules of the content schema. The schema of the item form is
 * `withContentProblems(contentFormValuesSchema, fields)`; the artifact form adds `title` and
 * `summary` to the object first.
 */
export function withContentProblems<Schema extends z.ZodType<ContentFormValues>>(
  schema: Schema,
  fields: readonly ContentField[],
): Schema {
  return schema.superRefine((values, context) => {
    for (const [name, message] of Object.entries(validateContent(fields, values.content))) {
      context.addIssue({ code: 'custom', message, path: ['content', name] })
    }
  })
}
