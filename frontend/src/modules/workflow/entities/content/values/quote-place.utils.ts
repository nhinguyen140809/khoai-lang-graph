import { textOf } from '@/shared/lib/text'

import type { ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import { contentFields } from '../fields/content-fields.utils'
import type { ContentValues } from './content-values.types'
import { findQuote } from './content-values.utils'
import type { QuotePlace } from './quote-place.types'

/**
 * Where the words that a link quotes of an item sit in the item. The fields that say what the
 * item is about are searched first, in the order of the schema, so the main field comes before
 * the others; the title field is searched last, since a title names the item and quotes it only
 * when it is all the item has to say. A quote that no text field holds, or an item whose kind has
 * no schema yet, places nothing, and the quote is shown as it is.
 */
export function placeQuote(
  schema: ContentSchema | undefined,
  item: { content: ContentValues },
  quote: string,
): QuotePlace {
  if (schema === undefined) return { type: 'quote' }
  const titleName = schema['x-ui-title-field']
  const fields = contentFields(schema)
  const found = findQuote(
    [
      ...fields.filter(({ name }) => name !== titleName),
      ...fields.filter(({ name }) => name === titleName),
    ],
    item.content,
    quote,
  )
  if (found === null) return { type: 'quote' }
  if (found.field === titleName) return { type: 'title', range: found.range }
  return {
    type: 'field',
    field: found.field,
    text: textOf(item.content[found.field]),
    range: found.range,
  }
}
