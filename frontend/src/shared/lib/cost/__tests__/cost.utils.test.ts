import { describe, expect, it } from 'vitest'

import { costLevel, costPercent, costShare } from '../cost.utils'
import { costLevelCases, costPercentCases, costShareCases } from './cost.utils.data'

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

describe('costShare', () => {
  it.each(costShareCases)('gives $name', ({ costUsd, limitUsd, share }) => {
    expect(costShare(costUsd, limitUsd)).toEqual(share)
  })
})
