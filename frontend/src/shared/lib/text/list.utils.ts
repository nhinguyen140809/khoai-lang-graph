import { formatLocale } from '@/shared/config/locale'

import type { SentencePart } from './text.types'

/**
 * A list of things written as a sentence of the locale ("A, B, and C") cut into parts, so that
 * each thing can render as a link while the words between them stay text. The separators are not
 * passed: they come from the locale, so the commas and the "and" follow the language of the app.
 */
export function listSentenceParts<T>(items: readonly T[]): SentencePart<T>[] {
  const formatter = new Intl.ListFormat(formatLocale, { type: 'conjunction', style: 'long' })
  return formatter
    .formatToParts(items.map((_item, index) => String(index)))
    .map((part) =>
      part.type === 'literal'
        ? { type: 'text', text: part.value }
        : { type: 'item', value: items[Number(part.value)] as T },
    )
}
