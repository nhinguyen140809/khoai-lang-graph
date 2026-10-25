/** The initials of a name for an avatar: the first letters of its first and last words. */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase())
  if (letters.length === 0) return '?'
  return letters.length === 1 ? (letters[0] ?? '') : `${letters[0] ?? ''}${letters.at(-1) ?? ''}`
}
