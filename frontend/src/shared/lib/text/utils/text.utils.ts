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
