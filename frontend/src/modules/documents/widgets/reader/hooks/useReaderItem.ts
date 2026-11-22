'use client'

import { useMemo } from 'react'

import { type ArtifactItem, outlineNeighbors, useItemSchema } from '@/modules/artifact/entities'
import {
  itemPageViewOf,
  useDocumentOutline,
  useEditLockReason,
  useItemStatus,
} from '@/modules/documents/entities'
import { useItemLinks } from '@/modules/trace/entities'
import { itemTitle, useKindTitles } from '@/modules/workflow/entities'

/**
 * What the reader shows of an item: the title of its kind, its own title, its status once the kinds
 * with issues have loaded, and how its fields are laid out: the same view of its kind that the page
 * of the item has, so that the reader shows what the page shows, with its place in its document and its links.
 */
export function useReaderItem(projectId: string, record: ArtifactItem) {
  const { schema } = useItemSchema(record)
  const kindTitles = useKindTitles()
  const { status, isUnderReview } = useItemStatus(projectId, record)
  const view = schema === undefined ? undefined : itemPageViewOf(schema)
  const outline = useDocumentOutline(record.artifact_id)
  const nodes = outline.state === 'success' ? outline.nodes : undefined
  const place = useMemo(() => outlineNeighbors(nodes ?? [], record.id).index, [nodes, record.id])
  const links = useItemLinks(record.id)
  const lockedReason = useEditLockReason(projectId, record.artifact_id)

  return {
    kindTitle: kindTitles.get(record.kind) ?? record.kind,
    title: itemTitle(schema, record),
    status,
    isUnderReview,
    view,
    /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
    place,
    links,
    lockedReason,
  }
}
