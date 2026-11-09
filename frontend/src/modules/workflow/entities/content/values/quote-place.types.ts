import type { TextRange } from '@/shared/lib/text'

/**
 * Where the words that a link quotes of an item sit in that item, so every screen puts them in
 * the same place:
 *
 * - `title`: in the title of the item, which is the item's own words when it has no other text, as
 *   a message of an interview. `range` is the place in the title.
 * - `field`: in another field of the content, that holds what the item says. `text` is the whole
 *   text of the field and `range` the place in it; the title is a name, and the words belong to
 *   what the item says.
 * - `quote`: in no field, so only the quote itself can show them.
 */
export type QuotePlace =
  | { type: 'title'; range: TextRange }
  | { type: 'field'; field: string; text: string; range: TextRange }
  | { type: 'quote' }
