'use client'

import { isEmpty } from '@/shared/lib/guards'

import type { ContentField } from '../fields/content-fields.types'
import type { ContentValues, ValueDefinition } from '../values/content-values.types'
import { ContentFieldValue } from './ContentFieldValue'

/**
 * The filled fields of a content as values on one line, in their order, each after its title for
 * assistive technology. The caller gives the line they sit on: under the name of an avatar card,
 * or on the key line of a page.
 */
export function InlineFieldValues({
  fields,
  content,
  definition,
}: {
  fields: readonly ContentField[]
  content: ContentValues
  definition: ValueDefinition
}) {
  return (
    <>
      {fields
        .filter((field) => !isEmpty(content[field.name]))
        .map((field, index) => (
          <span key={field.name} className={index > 0 ? 'ml-3' : undefined}>
            <span className="sr-only">{field.title}: </span>
            <ContentFieldValue field={field} value={content[field.name]} definition={definition} />
          </span>
        ))}
    </>
  )
}
