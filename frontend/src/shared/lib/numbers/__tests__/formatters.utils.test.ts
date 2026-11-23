import { describe, expect, it } from 'vitest'

import { formatCurrency, formatFileSize, formatNumber, formatPercent } from '../formatters.utils'
import { currencyCases, numberCases, percentCases } from './formatters.utils.data'

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

describe('formatFileSize', () => {
  it.each([
    [420, '420B'],
    [12 * 1024 + 512, '12.5kB'],
    [3.2 * 1024 * 1024, '3.2MB'],
  ])('writes %d bytes in the unit that reads best', (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text)
  })
})
