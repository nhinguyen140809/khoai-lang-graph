import { describe, expect, it } from 'vitest'

import { formatCost } from '../run-status.utils'

describe('formatCost', () => {
  it('shows dollars with two decimals', () => {
    expect(formatCost(0.42)).toBe('$0.42')
    expect(formatCost(2)).toBe('$2.00')
  })
})
