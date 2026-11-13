'use client'

import { type ReactNode } from 'react'

import type { useItemLinks } from '@/modules/trace/entities'
import { QuotedWordsPopover, quoteMarkColors } from '@/modules/trace/entities'

/** A mark of the quoted words, wrapped in the card of the items at the other end of its links. */
export function FieldMarkPopover({
  projectId,
  links,
  range,
  children,
}: {
  projectId: string
  links: ReturnType<typeof useItemLinks>
  range: { id: string; linkIds: string[] }
  children: ReactNode
}) {
  if (links.state !== 'success') return children
  const rows = range.linkIds.flatMap((id) => {
    const row = links.rowsByLinkId.get(id)
    return row === undefined ? [] : [row]
  })
  if (rows.length === 0) return children
  const outgoingIds = new Set(links.outgoing.flatMap(({ rows }) => rows.map((row) => row.link.id)))
  return (
    <QuotedWordsPopover
      projectId={projectId}
      entries={rows.map((row) => ({
        item: row.other,
        relation: {
          direction: outgoingIds.has(row.link.id) ? 'outgoing' : 'incoming',
          linkType: row.link.link_type,
        },
        isOutOfDate: row.isOutOfDate,
        otherQuote: outgoingIds.has(row.link.id) ? row.link.target_quote : row.link.source_quote,
        quoteColor: quoteMarkColors[outgoingIds.has(row.link.id) ? 'target' : 'source'],
        madeFromVersion: row.isOutOfDate ? row.link.target_version : null,
      }))}
    >
      <span>{children}</span>
    </QuotedWordsPopover>
  )
}
