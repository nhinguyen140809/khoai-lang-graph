import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { placeQuote } from '../quote-place.utils'
import { quotePlaceCases } from './quote-place.utils.data'

describe('placeQuote', () => {
  it.each(quotePlaceCases)('places $name', ({ kind, content, quote, expected }) => {
    const schema = kind === null ? undefined : contentSchemaFixtureByKind(kind)

    expect(placeQuote(schema, { content }, quote)).toEqual(expected)
  })

  it('names the range in the text it gives, so it reads the words that were quoted', () => {
    for (const { kind, content, quote, expected } of quotePlaceCases) {
      if (expected.type !== 'field') continue
      const place = placeQuote(
        kind === null ? undefined : contentSchemaFixtureByKind(kind),
        { content },
        quote,
      )
      if (place.type !== 'field') throw new Error('The words were not placed in a field')
      expect(place.text.slice(place.range.start, place.range.end).toLowerCase()).toBe(
        quote.toLowerCase(),
      )
    }
  })
})
