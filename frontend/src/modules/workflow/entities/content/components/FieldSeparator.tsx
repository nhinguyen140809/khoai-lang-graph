'use client'

import { Marker, MarkerContent } from '@/shared/components/ui/marker'
import { isBlank } from '@/shared/lib/guards'
import { textOf } from '@/shared/lib/text'

import type { ContentField } from '../fields/content-fields.types'
import { isChoiceField, isNumberField } from '../fields/content-fields.utils'
import { useValueLabelOf } from '../value-labels/hooks/useValueLabelOf'
import type { ContentValues, ValueDefinition } from '../values/content-values.types'

interface FieldSeparatorProps {
  /** The fields that mark the place, in the order of the schema. */
  fields: readonly ContentField[]
  content: ContentValues
  definition: ValueDefinition
  className?: string | undefined
}

/**
 * The text of one filled field of a separator: a number as its title and its value ("Turn 2"), a
 * choice as the label of its value ("Completed"), a text as itself.
 */
function SeparatorFieldValue({
  field,
  value,
  definition,
}: {
  field: ContentField
  value: unknown
  definition: ValueDefinition
}) {
  const labelOf = useValueLabelOf(field, definition)
  if (isNumberField(field)) {
    return (
      <>
        {field.title} {textOf(value)}
      </>
    )
  }
  if (isChoiceField(field)) {
    return <>{labelOf(textOf(value))}</>
  }
  return <>{textOf(value)}</>
}

/**
 * A separator that marks a place of a sequence, holding the filled fields that change there, side
 * by side. Nothing when no field is filled.
 */
export function FieldSeparator({ fields, content, definition, className }: FieldSeparatorProps) {
  const filled = fields.filter((field) => !isBlank(content[field.name]))
  if (filled.length === 0) return null
  return (
    <Marker variant="separator" className={className}>
      <MarkerContent>
        {filled.map((field, index) => (
          <span key={field.name} className={index > 0 ? 'ml-3' : undefined}>
            <SeparatorFieldValue
              field={field}
              value={content[field.name]}
              definition={definition}
            />
          </span>
        ))}
      </MarkerContent>
    </Marker>
  )
}
