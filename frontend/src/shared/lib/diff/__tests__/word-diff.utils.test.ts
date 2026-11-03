import { describe, expect, it } from 'vitest'

import { wordDiff } from '../word-diff.utils'
import { wordDiffCases } from './word-diff.utils.data'

describe('wordDiff', () => {
  it.each(wordDiffCases)('diffs $name', ({ before, after, expected }) => {
    expect(wordDiff(before, after)).toEqual(expected)
  })

  it('gives parts that put together read as the before and the after', () => {
    // A change of spaces alone is left out, so the parts read as the words of the texts, and the
    // spaces a part carries may join or split: only the words are compared, not their places.
    const wordsOf = (text: string) =>
      text
        .split(/\s+/)
        .filter((word) => word !== '')
        .join(' ')

    for (const { before, after } of wordDiffCases) {
      const parts = wordDiff(before, after)
      const readsBefore = parts
        .filter(({ change }) => change !== 'added')
        .map(({ text }) => text)
        .join('')
      const readsAfter = parts
        .filter(({ change }) => change !== 'removed')
        .map(({ text }) => text)
        .join('')

      expect(wordsOf(readsBefore)).toBe(wordsOf(before))
      expect(wordsOf(readsAfter)).toBe(wordsOf(after))
    }
  })
})
