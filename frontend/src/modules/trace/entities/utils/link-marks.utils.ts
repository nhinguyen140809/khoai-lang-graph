import type { ContentField, ContentValues } from '@/modules/workflow/entities/@x/trace'
import { findQuote } from '@/modules/workflow/entities/@x/trace'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import { quoteRange } from '@/shared/lib/text'

import { quoteMarkColors } from '../constants/link-marks.constants'
import type { LinkQuote } from '../types/chains.types'
import type { LinkMarkRange } from '../types/item-links.types'

// The marks of the words that links quote: each quote placed in the text of its item, overlapping
// ranges of one field merged into one mark that carries all their links, underlined in the color
// of the direction of the link (link-marks.constants).

function markOf(link: LinkQuote, range: HighlightRange): LinkMarkRange {
  return {
    ...range,
    id: link.link.id,
    linkIds: [link.link.id],
    variant: 'underline',
    color: quoteMarkColors[link.side],
    strokeWidth: 3,
  }
}

// Puts a range among the marks of one text, merging it with the ones it overlaps.
function mergeInto(marks: LinkMarkRange[], range: LinkMarkRange) {
  const overlapping = marks.filter((mark) => mark.start < range.end && range.start < mark.end)
  if (overlapping.length === 0) {
    marks.push(range)
    return
  }
  const apart = marks.filter((mark) => !(mark.start < range.end && range.start < mark.end))
  // A merge of both directions keeps the yellow, so the words that another record quotes stay
  // findable; the mark still carries the links of both.
  const merged: LinkMarkRange = [range, ...overlapping].reduce((whole, part) => ({
    id: whole.id === '' ? part.id : whole.id,
    linkIds: [...whole.linkIds, ...part.linkIds.filter((id) => !whole.linkIds.includes(id))],
    start: Math.min(whole.start, part.start),
    end: Math.max(whole.end, part.end),
    variant: whole.variant ?? part.variant,
    color: whole.color === 'chart' || part.color === 'chart' ? 'chart' : 'primary',
    strokeWidth: whole.strokeWidth ?? part.strokeWidth,
  }))
  apart.push(merged)
  marks.length = 0
  marks.push(...apart)
}

/**
 * The marks of the quoted words of an item, by field name: each quote placed with `findQuote`,
 * overlapping ranges of one field merged into one mark with all their links, underlined in the
 * color of the direction of the link. The fields are searched in the order given, the main
 * field first.
 */
export function fieldMarksOf(
  content: ContentValues,
  quotes: readonly LinkQuote[],
  { fields }: { fields: readonly ContentField[] },
): ReadonlyMap<string, LinkMarkRange[]> {
  const byField = new Map<string, LinkMarkRange[]>()
  for (const quote of quotes) {
    const found = findQuote(fields, content, quote.quote)
    if (found === null) continue
    const marks = byField.get(found.field) ?? []
    mergeInto(marks, markOf(quote, found.range))
    byField.set(found.field, marks)
  }
  return byField
}

/** The same for one text, such as a message of a transcript. */
export function markRangesOf(text: string, quotes: readonly LinkQuote[]): LinkMarkRange[] {
  const marks: LinkMarkRange[] = []
  for (const quote of quotes) {
    const range = quoteRange(text, quote.quote)
    if (range === null) continue
    mergeInto(marks, markOf(quote, range))
  }
  return marks
}
