import type { ReactNode } from 'react'

import type { HighlightRange } from '@/shared/components/ui/highlight'
import { cn } from '@/shared/lib/cn'

import type { ContentField } from '../fields/content-fields.types'
import type { ValueDefinition } from '../values/content-values.types'
import { ContentFieldValue } from './ContentFieldValue'

interface ContentFieldListProps<Range extends HighlightRange = HighlightRange> {
  fields: readonly ContentField[]
  /** The content of the item, by field name. */
  content: Readonly<Record<string, unknown>>
  definition: ValueDefinition
  /** The quoted words of the item, by field name. */
  fieldMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a field, for example in the trigger of a popover. */
  renderFieldMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
  className?: string
}

/** The fields of an item, each under its title, in the order they are given: the plain body of an item. */
export function ContentFieldList<Range extends HighlightRange = HighlightRange>({
  fields,
  content,
  definition,
  fieldMarks,
  renderFieldMark,
  className,
}: ContentFieldListProps<Range>) {
  return (
    <div className={cn('space-y-6', className)}>
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
          <div className="space-y-2">
            <ContentFieldValue
              field={field}
              value={content[field.name]}
              definition={definition}
              marks={fieldMarks?.get(field.name)}
              renderMark={renderFieldMark}
            />
          </div>
        </section>
      ))}
    </div>
  )
}
