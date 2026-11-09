import type { ContentSchema, ContentValues } from '@/modules/workflow/entities/@x/trace'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import type { Tone } from '@/shared/lib/tone'

import type { ItemLinkGroup, ItemLinkRow, LinkQuote } from '../chains/chains.types'

/** A mark of the words that links quote: the range, its color, and the links that quote these words. */
export interface LinkMarkRange extends HighlightRange {
  id: string
  linkIds: string[]
}

/**
 * How a linked item relates to the one the page shows: the words of the type of its link, and
 * whether that link leaves the item the page shows or reaches it; a card on a message quotes the
 * words of that message.
 */
export type LinkedRelation =
  | { direction: 'outgoing'; linkType: string }
  | { direction: 'incoming'; linkType: string }
  | { direction: 'quotes' }

/** One item at the other end of a link, as the card shows it. */
export interface LinkedEntry {
  item: LinkQuote['other']
  relation: LinkedRelation
  isOutOfDate: boolean
  /** The words that the link quotes on the side of this item, or null. */
  otherQuote: string | null
  /** The color the other end of the link reads in: the opposite of the color of the mark. */
  quoteColor: Tone
  /** The version of the target of the link when it was made, when the link is out of date; else null. */
  madeFromVersion: number | null
}

/** The links of an item from it and to it, grouped by link type, each row titled, and the marks of their words in its text; a union with `state`. */
export type ItemLinksResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      outgoing: ItemLinkGroup[]
      incoming: ItemLinkGroup[]
      count: number
      /** The marks of the quoted words of the item, by field name. */
      fieldMarks: ReadonlyMap<string, LinkMarkRange[]>
      /** The row of each link, so that a mark finds the entries of its card. */
      rowsByLinkId: ReadonlyMap<string, ItemLinkRow>
    }

/** An item as a card of its quoted words reads it: what its title and its words come from. */
export interface QuotedItem {
  key: string
  content: ContentValues
  /** The schema of its kind; none while the kinds load or for a kind without one. */
  schema: ContentSchema | undefined
}
