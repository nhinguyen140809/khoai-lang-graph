'use client'

import { type ArtifactItem, useItemSchema } from '@/modules/artifact/entities'
import { useItemStatus } from '@/modules/documents/entities'
import { contentFields, itemTitle, useKindTitles } from '@/modules/workflow/entities'
import { isEmpty } from '@/shared/lib/guards'

/**
 * What the reader shows of an item: the title of its kind, its own title, its status once the kinds
 * with issues have loaded, and its filled fields in the order of its schema.
 */
export function useReaderItem(projectId: string, record: ArtifactItem) {
  const { schema } = useItemSchema(record)
  const kindTitles = useKindTitles()
  const { status, isUnderReview } = useItemStatus(projectId, record)
  const fields =
    schema === undefined
      ? []
      : contentFields(schema).filter((field) => !isEmpty(record.content[field.name]))

  return {
    kindTitle: kindTitles.get(record.kind) ?? record.kind,
    title: itemTitle(schema, record),
    status,
    isUnderReview,
    fields,
  }
}
