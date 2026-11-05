'use client'

import type { ReactNode } from 'react'

import type { ContentSchema } from '@/modules/workflow/entities/@x/artifact'
import {
  contentFields,
  ContentFieldValue,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { ColoredText } from '@/shared/components/ui/colored-text'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import { isEmpty } from '@/shared/lib/guards'

import type { ArtifactItem } from '../items/items.types'
import { useItemStatusLook } from '../status/hooks/useItemStatusLook'
import type { ItemStatus } from '../status/item-status.types'

interface ItemKeyLineProps {
  item: ArtifactItem
  status: ItemStatus
  /** Whether the document of the item waits for the review of the user. */
  isUnderReview: boolean
}

/**
 * The key line of an item: the label of its status in its color and the key; the history holds
 * the versions. The page draws it right under the title, with the links of the item under it.
 */
export function ItemKeyLine({ item, status, isUnderReview }: ItemKeyLineProps) {
  const look = useItemStatusLook(status, { isUnderReview })

  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <ColoredText color={look.color} className="font-semibold">
        {look.label}
      </ColoredText>
      <span className="font-mono text-xs text-muted-foreground">{item.key}</span>
    </p>
  )
}

interface ArtifactItemDetailsProps<Range extends HighlightRange = HighlightRange> {
  item: ArtifactItem
  schema: ContentSchema
  /** The quoted words of the item, by field name. */
  fieldMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a field, for example in the trigger of a popover. */
  renderFieldMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/**
 * The fields of one item: every filled field in the order of the schema, the label above the
 * value, with the words that links quote marked. The title, the key line and the links are the
 * page's.
 */
export function ArtifactItemDetails<Range extends HighlightRange = HighlightRange>({
  item,
  schema,
  fieldMarks,
  renderFieldMark,
}: ArtifactItemDetailsProps<Range>) {
  const { data: definition } = useWorkflowDefinition()
  const fields = contentFields(schema).filter((field) => !isEmpty(item.content[field.name]))

  return (
    <div className="max-w-190 space-y-6">
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
          <div className="space-y-2">
            <ContentFieldValue
              field={field}
              value={item.content[field.name]}
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
