import { itemTitle, placeQuote, type QuotePlace } from '@/modules/workflow/entities/@x/trace'

import type { QuotedItem } from './item-links.types'

/**
 * What a card of a quoted item shows: the title of the item, and where the words that a link
 * quotes of it sit. A quote that is missing or blank has no place, so the card shows the title
 * alone.
 */
export function quotedItemView(
  { key, content, schema }: QuotedItem,
  quote: string | null,
): { title: string; place: QuotePlace | null } {
  const hasQuote = quote !== null && quote.trim() !== ''
  return {
    title: itemTitle(schema, { key, content }),
    place: hasQuote ? placeQuote(schema, { content }, quote) : null,
  }
}
