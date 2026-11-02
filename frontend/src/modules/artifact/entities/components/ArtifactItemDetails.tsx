'use client'

import type { ContentSchema } from '@/modules/workflow/entities/@x/artifact'
import {
  contentFields,
  ContentFieldValue,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { isEmpty } from '@/shared/lib/guards'

import type { ArtifactItem } from '../items/items.types'
import { useItemStatusLook } from '../status/hooks/useItemStatusLook'
import type { ItemStatus } from '../status/item-status.types'
import { artifactViewMessages } from './artifact-view.constants'

interface ArtifactItemDetailsProps {
  item: ArtifactItem
  schema: ContentSchema
  status: ItemStatus
  /** Whether the document of the item waits for the review of the user. */
  isUnderReview: boolean
}

/**
 * The fields of one item: its key line (the label of its status in its color, the key, and the
 * version once the item was changed) and every filled field in the order of the schema, the label above the value. The title is the
 * page's.
 */
export function ArtifactItemDetails({
  item,
  schema,
  status,
  isUnderReview,
}: ArtifactItemDetailsProps) {
  const { data: definition } = useWorkflowDefinition()
  const look = useItemStatusLook(status, { isUnderReview })
  const fields = contentFields(schema).filter((field) => !isEmpty(item.content[field.name]))

  return (
    <div className="max-w-190 space-y-6">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <ColoredText color={look.color} className="font-semibold">
          {look.label}
        </ColoredText>
        <span className="font-mono text-xs text-muted-foreground">{item.key}</span>
        {item.version > 1 && (
          <span className="text-muted-foreground">
            {artifactViewMessages.version(item.version)}
          </span>
        )}
      </p>
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
          <div className="space-y-2">
            <ContentFieldValue
              field={field}
              value={item.content[field.name]}
              definition={definition}
            />
          </div>
        </section>
      ))}
    </div>
  )
}
