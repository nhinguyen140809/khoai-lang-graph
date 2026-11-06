import type { TextRange } from './text.types'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Where the first quote sits in a text, or null when it is not there. The words must be the same,
 * but case and the kind of space between them may differ, since the text may have been wrapped or
 * edited since the quote was taken. A blank quote sits nowhere.
 */
export function quoteRange(text: string, quote: string): TextRange | null {
  const words = quote
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '')
  if (words.length === 0) return null
  const pattern = new RegExp(words.map(escapeRegExp).join(String.raw`\s+`), 'iu')
  const match = pattern.exec(text)
  return match === null ? null : { start: match.index, end: match.index + match[0].length }
}
