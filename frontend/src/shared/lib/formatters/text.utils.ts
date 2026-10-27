/** The text with its first letter in upper case: "acceptance criteria" as "Acceptance criteria". */
export function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

/** A snake_case key in sentence case: "acceptance_criteria" becomes "Acceptance criteria". */
export function snakeToSentenceCase(key: string): string {
  return capitalize(key.replaceAll('_', ' '))
}

/** The initials of a name for an avatar: the first letters of its first and last words. */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase())
  if (letters.length === 0) return '?'
  return letters.length === 1 ? (letters[0] ?? '') : `${letters[0] ?? ''}${letters.at(-1) ?? ''}`
}
