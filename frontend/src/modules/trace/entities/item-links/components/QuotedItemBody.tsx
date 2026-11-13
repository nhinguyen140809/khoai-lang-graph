'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { Highlight, HighlightMark } from '@/shared/components/ui/highlight'
import { excerptAround } from '@/shared/lib/text'
import type { Tone } from '@/shared/lib/tone'

import type { QuotedItem } from '../item-links.types'
import { quotedItemView } from '../quoted-item.utils'

interface QuotedItemBodyProps {
  /** The title of the kind of the item. */
  kind: string
  /** The item, with the schema of its kind, which says where its words are. */
  item: QuotedItem
  /** The words of the item that a link quotes; none when the link quotes no words of it. */
  quote: string | null
  /** The color of the mark of the words. */
  color: Tone
  /** The classes of the title line, for a caller whose card changes it on hover. */
  titleClassName?: string | undefined
  /** Draws the title of the item inside what the caller makes of it, such as a link to its page. */
  wrapTitle?: ((title: ReactNode) => ReactNode) | undefined
}

// How many characters of a field a card shows around the words quoted from it.
const EXCERPT_LENGTH = 160

/**
 * What every card of a quoted item says, put one under the other: the kind of the item, small and
 * muted; its title, in full and bold; and the words that a link quotes of it, put where `placeQuote`
 * finds them: marked in the title when the item has no other words than its title, else marked in
 * the sentence of the field that holds them, and shown as the quote itself only when no field holds
 * them. The words are never said twice. It draws no box and no link of its own, so a card of any
 * shape can hold it: the card of the issues, the strip of a link, and the cards of the popovers.
 */
export function QuotedItemBody({
  kind,
  item,
  quote,
  color,
  titleClassName,
  wrapTitle,
}: QuotedItemBodyProps) {
  const { title, place } = quotedItemView(item, quote)
  const excerpt =
    place?.type === 'field' ? excerptAround(place.text, place.range, EXCERPT_LENGTH) : null
  const marked = (
    <Highlight variant="soft" color={color} ranges={place?.type === 'title' ? [place.range] : []}>
      {title}
    </Highlight>
  )

  return (
    <>
      <span className="-mb-0.5 block text-xs text-muted-foreground">{kind}</span>
      {/* A long title is cut with an ellipsis: on one line, or on three when it carries the marked
          words, which the cut must not hide as far as it can help. */}
      <span
        className={cn(
          'block text-sm font-semibold',
          place?.type === 'title' ? 'line-clamp-3' : 'truncate',
          titleClassName,
        )}
      >
        {wrapTitle === undefined ? marked : wrapTitle(marked)}
      </span>
      {excerpt !== null && (
        <span data-slot="quote-excerpt" className="block text-sm">
          <Highlight variant="soft" color={color} ranges={[excerpt.range]}>
            {excerpt.text}
          </Highlight>
        </span>
      )}
      {place?.type === 'quote' && quote !== null && (
        <span data-slot="quote-excerpt" className="block text-sm">
          <HighlightMark variant="soft" color={color}>
            {quote}
          </HighlightMark>
        </span>
      )}
    </>
  )
}
