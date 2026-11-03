/** A part of a text: from the character at `start` up to, and not including, the one at `end`. */
export interface TextRange {
  start: number
  end: number
}

/**
 * A piece of a text: the words of a range, or the words between two ranges when `range` is null.
 * The pieces of a text, put end to end, give the text again.
 */
export interface TextSegment<Range extends TextRange = TextRange> {
  text: string
  range: Range | null
}
