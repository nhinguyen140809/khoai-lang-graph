import { describe, expect, it } from 'vitest'

import { costLevel, costPercent } from '../cost.utils'
import { costLevelCases, costPercentCases } from './cost.utils.data'

describe('costLevel', () => {
  it.each(costLevelCases)('puts $percent percent at $level', ({ percent, level }) => {
    expect(costLevel(percent)).toBe(level)
  })
})

describe('costPercent', () => {
  it.each(costPercentCases)('gives $name', ({ costUsd, limitUsd, percent }) => {
    expect(costPercent(costUsd, limitUsd)).toBe(percent)
  })
})
