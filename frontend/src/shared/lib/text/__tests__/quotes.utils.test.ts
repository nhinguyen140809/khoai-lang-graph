import { describe, expect, it } from 'vitest'

import { excerptAround, quoteRange } from '../quotes.utils'
import { cutExcerptCases, quoteCases, wholeExcerptCase } from './quotes.utils.data'

describe('quoteRange', () => {
  it.each(quoteCases)('finds $name', ({ text, quote, expected }) => {
    expect(quoteRange(text, quote)).toEqual(expected)
  })
})

describe('excerptAround', () => {
  it('gives a text that is short enough whole, with its range', () => {
    const { text, range, maxLength } = wholeExcerptCase

    expect(excerptAround(text, range, maxLength)).toEqual({ text, range })
  })

  it.each(cutExcerptCases)('cuts around $name', ({ text, range, maxLength, expectedFrom }) => {
    const excerpt = excerptAround(text, range, maxLength)

    // The range, moved into the excerpt, still reads the words of the original range.
    expect(excerpt.text.slice(excerpt.range.start, excerpt.range.end)).toBe(
      text.slice(range.start, range.end),
    )
    // An ellipsis stands at each end that was cut, outside the range, and at no other.
    expect(excerpt.text.startsWith('...')).toBe(expectedFrom !== 'start')
    expect(excerpt.text.endsWith('...')).toBe(expectedFrom !== 'end' && range.end < text.length)
    // Its length is kept near the limit: the limit and the two ellipses.
    expect(excerpt.text.length).toBeLessThanOrEqual(maxLength + 6)
    // A cut never falls inside a word.
    const body = excerpt.text.replace(/^\.\.\./, '').replace(/\.\.\.$/, '')
    expect(text).toContain(body)
    expect(body.startsWith(' ') || body.endsWith(' ')).toBe(false)
  })

  it('never takes away a character of a range longer than the limit', () => {
    const text = 'one two three four five six seven eight nine ten'
    const range = { start: 4, end: 40 }

    const excerpt = excerptAround(text, range, 10)

    expect(excerpt.text.slice(excerpt.range.start, excerpt.range.end)).toBe(
      text.slice(range.start, range.end),
    )
  })
})
