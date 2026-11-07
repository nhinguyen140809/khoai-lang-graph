import type { TextRange, TextSegment } from './text.types'
import { foldText } from './text.utils'

interface MatchOptions {
  /** Whether case and accents are left out when matching, as `foldText` does; true when absent. */
  ignoreCase?: boolean | undefined
  /** Whether every place of a query is found, or only the first; true when absent. */
  matchAll?: boolean | undefined
}

// The text as it is matched, with the range of the text that each of its characters comes from, so
// that a match in the folded text maps back to the text. Folding one character at a time keeps the
// two aligned: a mark that an accent leaves behind has no character of its own.
function foldedWithOrigins(text: string, isFolded: boolean) {
  if (!isFolded) return { matched: text, starts: null, ends: null }
  let matched = ''
  const starts: number[] = []
  const ends: number[] = []
  let index = 0
  for (const character of text) {
    const folded = foldText(character)
    starts.push(...new Array<number>(folded.length).fill(index))
    ends.push(...new Array<number>(folded.length).fill(index + character.length))
    matched += folded
    index += character.length
  }
  return { matched, starts, ends }
}

function placesOf(
  text: string,
  query: string,
  { ignoreCase = true, matchAll = true }: MatchOptions,
) {
  const { matched, starts, ends } = foldedWithOrigins(text, ignoreCase)
  const wanted = ignoreCase ? foldText(query) : query
  const places: TextRange[] = []
  if (wanted === '') return places
  for (
    let from = matched.indexOf(wanted);
    from !== -1;
    from = matched.indexOf(wanted, from + wanted.length)
  ) {
    const last = from + wanted.length - 1
    places.push({ start: starts?.[from] ?? from, end: ends?.[last] ?? last + 1 })
    if (!matchAll) break
  }
  return places
}

/**
 * The ranges, in order, with no two that share a character: they are sorted by start, a longer
 * range comes before a shorter one that starts at the same place, and a range that starts inside
 * the one before it is dropped. A range is cut to the text, and an empty one is dropped.
 */
function orderedRanges<Range extends TextRange>(textLength: number, ranges: readonly Range[]) {
  const sorted = ranges
    .map((range) => ({
      ...range,
      start: Math.max(range.start, 0),
      end: Math.min(range.end, textLength),
    }))
    .filter(({ start, end }) => start < end)
    .toSorted((a, b) => a.start - b.start || b.end - a.end)
  const ordered: Range[] = []
  let lastEnd = 0
  for (const range of sorted) {
    if (range.start < lastEnd) continue
    ordered.push(range)
    lastEnd = range.end
  }
  return ordered
}

/**
 * Where the words of a query, or of several, sit in a text, in order and with no overlap. A query
 * that is empty matches nothing. When two queries meet at the same place, the longer one wins.
 */
export function rangesOfQuery(
  text: string,
  query: string | readonly string[],
  options: MatchOptions = {},
): TextRange[] {
  const queries = typeof query === 'string' ? [query] : query
  const places = queries
    .filter((part) => part !== '')
    .flatMap((part) => placesOf(text, part, options))
  return orderedRanges(text.length, places)
}

/**
 * The text cut into pieces at the ranges, in order: the pieces of the ranges, with the pieces of
 * the words between them. A range that overlaps the one before it is left out, and an empty piece
 * is never given.
 */
export function splitByRanges<Range extends TextRange>(
  text: string,
  ranges: readonly Range[],
): TextSegment<Range>[] {
  const segments: TextSegment<Range>[] = []
  let position = 0
  for (const range of orderedRanges(text.length, ranges)) {
    if (range.start > position)
      segments.push({ text: text.slice(position, range.start), range: null })
    segments.push({ text: text.slice(range.start, range.end), range })
    position = range.end
  }
  if (position < text.length) segments.push({ text: text.slice(position), range: null })
  return segments
}
