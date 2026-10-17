import { describe, expect, it } from 'vitest'

import { formatRelativeTime } from '../time.utils'
import { now, relativeTimeCases } from './time.utils.data'

describe('formatRelativeTime', () => {
  it.each(relativeTimeCases)('formats %s as %j', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected)
  })
})
