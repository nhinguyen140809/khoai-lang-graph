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

/** A part of a text cut around a range, with the range as it sits in the part. */
interface TextExcerpt {
  text: string
  range: TextRange
}

const ELLIPSIS = '...'

/**
 * The part of a text of at most `maxLength` characters that holds `range`, with the range moved to
 * where it sits in the part. A text that is short enough comes back whole. A cut never falls inside
 * a word and never takes away a character of the range, and each end that was cut says so with an
 * ellipsis, which is outside the range.
 */
export function excerptAround(text: string, range: TextRange, maxLength: number): TextExcerpt {
  if (text.length <= maxLength) return { text, range }
  const rangeLength = range.end - range.start
  const length = Math.max(maxLength, rangeLength)
  const spare = Math.floor((length - rangeLength) / 2)
  let start = Math.max(0, Math.min(range.start - spare, text.length - length))
  let end = Math.min(text.length, start + length)
  // A cut inside a word moves to the space next to it, on the side away from the range.
  if (start > 0 && text[start - 1] !== ' ') {
    const space = text.indexOf(' ', start)
    if (space !== -1 && space < range.start) start = space + 1
  }
  if (end < text.length && text[end] !== ' ') {
    const space = text.lastIndexOf(' ', end)
    if (space >= range.end) end = space
  }
  const before = start > 0 ? ELLIPSIS : ''
  const after = end < text.length ? ELLIPSIS : ''
  const shift = before.length - start
  return {
    text: `${before}${text.slice(start, end)}${after}`,
    range: { start: range.start + shift, end: range.end + shift },
  }
}
