import { describe, expect, it } from 'vitest'

import { formatUsd } from '../currency.utils'
import { formatUsdCases } from './currency.utils.data'

describe('formatUsd', () => {
  it.each(formatUsdCases)('writes $amount as $text', ({ amount, text }) => {
    expect(formatUsd(amount)).toBe(text)
  })
})
