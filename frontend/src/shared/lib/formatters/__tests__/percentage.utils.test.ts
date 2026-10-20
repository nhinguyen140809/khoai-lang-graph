import { describe, expect, it } from 'vitest'

import { formatPercent } from '../percentage.utils'
import { formatPercentCases } from './percentage.utils.data'

describe('formatPercent', () => {
  it.each(formatPercentCases)('writes $percent as $text', ({ percent, text }) => {
    expect(formatPercent(percent)).toBe(text)
  })
})
