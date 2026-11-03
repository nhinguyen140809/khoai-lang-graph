import type { TraceLink } from '@/modules/trace/entities'

import { IdPrefix, nextCreatedId } from '../shared/db'
import { createdTraceLinks, deletedTraceLinkIds } from './trace-links.store'
import type { NewTraceLinkRecord } from './trace-links.types'

// The writes to the trace links: the only code that sets their store.

/** Makes the link that a checked body describes. */
export function addTraceLink(record: NewTraceLinkRecord): TraceLink {
  const link: TraceLink = {
    id: nextCreatedId(IdPrefix.TraceLink, createdTraceLinks),
    source_item_id: record.sourceItemId,
    target_item_id: record.targetItemId,
    link_type: record.linkType,
    target_version: record.targetVersion,
    target_quote: record.targetQuote,
    source_quote: record.sourceQuote,
    note: record.note,
  }
  createdTraceLinks.set([...createdTraceLinks.get(), link])
  return link
}

/** Removes a link: it stays in the fixtures or the store, and the reads leave it out. */
export function removeTraceLink(linkId: string): void {
  deletedTraceLinkIds.set([...deletedTraceLinkIds.get(), linkId])
}
