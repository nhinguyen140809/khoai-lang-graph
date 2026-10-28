import type { TraceLink } from '@/modules/trace/entities'

import { createdId, IdPrefix } from '../shared/db'
import { createdTraceLinks, deletedTraceLinkIds } from './trace-links.store'
import type { NewTraceLinkRecord } from './trace-links.types'

// The writes to the trace links: the only code that sets their store.

/** Makes the link that a checked body describes. */
export function addTraceLink(record: NewTraceLinkRecord): TraceLink {
  const link: TraceLink = {
    id: createdId(IdPrefix.TraceLink, createdTraceLinks.get().length + 1),
    source_item_id: record.sourceItemId,
    target_item_id: record.targetItemId,
    link_type: record.linkType,
    target_version: record.targetVersion,
    quote: null,
    note: record.note,
  }
  createdTraceLinks.set([...createdTraceLinks.get(), link])
  return link
}

/** Removes a link: it stays in the fixtures or the store, and the reads leave it out. */
export function removeTraceLink(linkId: string): void {
  deletedTraceLinkIds.set([...deletedTraceLinkIds.get(), linkId])
}
