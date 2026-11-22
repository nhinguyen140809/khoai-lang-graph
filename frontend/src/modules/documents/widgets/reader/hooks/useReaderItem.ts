'use client'

import { type ArtifactItem, useItemSchema } from '@/modules/artifact/entities'
import { itemPageViewOf, useItemStatus } from '@/modules/documents/entities'
import { itemTitle, useKindTitles } from '@/modules/workflow/entities'

/**
 * What the reader shows of an item: the title of its kind, its own title, its status once the kinds
 * with issues have loaded, and how its fields are laid out: the same view of its kind that the page
 * of the item has, so that the reader shows what the page shows.
 */
export function useReaderItem(projectId: string, record: ArtifactItem) {
  const { schema } = useItemSchema(record)
  const kindTitles = useKindTitles()
  const { status, isUnderReview } = useItemStatus(projectId, record)
  const view = schema === undefined ? undefined : itemPageViewOf(schema)

  return {
    kindTitle: kindTitles.get(record.kind) ?? record.kind,
    title: itemTitle(schema, record),
    status,
    isUnderReview,
    view,
  }
}
