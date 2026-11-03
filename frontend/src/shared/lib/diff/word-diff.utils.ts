import { diffWords } from 'diff'

import type { DiffPart } from './diff.types'

/**
 * The words that changed from one text to the next, as the parts that read from left to right.
 * The words are compared, not the lines or the letters, so a change reads where it sits in its
 * sentence. A change of spaces alone inside a sentence is left out; the words around them read
 * as they were.
 */
export function wordDiff(before: string, after: string): DiffPart[] {
  return diffWords(before, after).map(({ value, added, removed }) => ({
    text: value,
    change: added ? 'added' : removed ? 'removed' : 'same',
  }))
}
