'use client'

import { type ReactNode } from 'react'

import type { useLinkQuotesOf } from '@/modules/trace/entities'
import { QuotedWordsPopover, quoteMarkColors } from '@/modules/trace/entities'

/** A mark of the words of a message, wrapped in the card of the items that quote them. */
export function MessageMarkPopover({
  projectId,
  quotes,
  range,
  children,
}: {
  projectId: string
  quotes: ReturnType<typeof useLinkQuotesOf>
  range: { id: string; linkIds: string[] }
  children: ReactNode
}) {
  if (quotes.state !== 'success') return children
  const quotesOfMark = range.linkIds.flatMap((id) => {
    const quote = quotes.quotesByLinkId.get(id)
    return quote === undefined ? [] : [quote]
  })
  if (quotesOfMark.length === 0) return children
  return (
    <QuotedWordsPopover
      projectId={projectId}
      entries={quotesOfMark.map((quote) => ({
        item: quote.other,
        relation: { direction: 'quotes' },
        isOutOfDate: false,
        otherQuote: quote.link.source_quote,
        quoteColor: quoteMarkColors.source,
        madeFromVersion: null,
      }))}
    >
      {children}
    </QuotedWordsPopover>
  )
}
