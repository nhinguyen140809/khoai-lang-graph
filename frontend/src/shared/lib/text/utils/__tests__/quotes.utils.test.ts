import { describe, expect, it } from 'vitest'

import { quoteRange } from '../quotes.utils'
import { quoteCases } from './quotes.utils.data'

describe('quoteRange', () => {
  it.each(quoteCases)('finds $name', ({ text, quote, expected }) => {
    expect(quoteRange(text, quote)).toEqual(expected)
  })
})
