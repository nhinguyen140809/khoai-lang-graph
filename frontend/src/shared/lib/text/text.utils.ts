import { hasText } from '@/shared/lib/guards'

/**
 * The text in lower case and without accents, so that "Nguyễn" and "nguyen" read the same. The
 * letter "đ" has no accent to strip, so it is written out as "d".
 */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replaceAll('đ', 'd')
}

/** Whether `text` holds `part`, whatever the case and the accents of either. */
export function hasTextPart(text: string, part: string): boolean {
  return foldText(text).includes(foldText(part))
}

/** A string, number or boolean value as text; anything else, such as a list or a missing value, as empty text. */
export function textOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/** The first line of a text that holds more than whitespace, trimmed; empty text without one. */
export function firstLineOf(text: string): string {
  const first = text.split('\n').find(hasText)
  return first === undefined ? '' : first.trim()
}

/** The parts that hold text, joined by `separator`, ", " by default. */
export function joinPresent(
  parts: readonly (string | null | undefined)[],
  separator = ', ',
): string {
  return parts
    .filter((part) => part !== null && part !== undefined && hasText(part))
    .join(separator)
}

/** The article before a word, by the sound of its first letter, for a sentence that names it. */
export function articleOf(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}
