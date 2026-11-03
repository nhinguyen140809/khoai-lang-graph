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
