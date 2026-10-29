import { describe, expect, it } from 'vitest'

import { refetchIntervalOf } from '../runs.utils'
import { pollCases } from './runs.utils.data'

describe('refetchIntervalOf', () => {
  it.each(pollCases)('answers for $name', ({ status, interval }) => {
    expect(refetchIntervalOf(status)).toBe(interval)
  })
})
