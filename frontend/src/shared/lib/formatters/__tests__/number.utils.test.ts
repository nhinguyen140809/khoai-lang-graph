import { describe, expect, it } from 'vitest'

import { formatCurrency, formatNumber, formatPercent } from '../number.utils'
import { currencyCases, numberCases, percentCases } from './number.utils.data'

describe('formatNumber', () => {
  it.each(numberCases)('writes $name as $text', ({ value, text }) => {
    expect(formatNumber(value)).toBe(text)
  })
})

describe('formatPercent', () => {
  it.each(percentCases)('writes $name as $text', ({ ratio, digits, text }) => {
    expect(formatPercent(ratio, digits)).toBe(text)
  })
})

describe('formatCurrency', () => {
  it.each(currencyCases)('writes $name as $text', ({ value, currency, text }) => {
    expect(formatCurrency(value, currency)).toBe(text)
  })
})
