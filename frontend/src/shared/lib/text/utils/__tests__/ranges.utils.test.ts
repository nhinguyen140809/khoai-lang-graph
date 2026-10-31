import { describe, expect, it } from 'vitest'

import { rangesOfQuery, splitByRanges } from '../ranges.utils'
import { queryCases, splitCases } from './ranges.utils.data'

describe('rangesOfQuery', () => {
  it.each(queryCases)('finds $name', ({ text, query, options, expected }) => {
    expect(rangesOfQuery(text, query, options)).toEqual(expected)
  })
})

describe('splitByRanges', () => {
  it.each(splitCases)('cuts $name', ({ text, ranges, expected }) => {
    const segments = splitByRanges(text, ranges)

    expect(
      segments.map(({ text: piece, range }) => ({ text: piece, isRange: range !== null })),
    ).toEqual(expected)
    expect(segments.map((segment) => segment.text).join('')).toBe(text === '' ? '' : text)
  })

  it('gives back the range object it was given, with the fields it carries', () => {
    const range = { start: 0, end: 2, color: 'primary' }

    expect(splitByRanges('abc', [range])[0]?.range).toMatchObject(range)
  })
})
