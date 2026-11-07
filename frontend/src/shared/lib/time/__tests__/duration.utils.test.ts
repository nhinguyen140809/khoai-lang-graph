import { describe, expect, it } from 'vitest'

import { msBetween, roundedDuration } from '../duration.utils'

describe('msBetween', () => {
  it('reads the milliseconds between two times of the API', () => {
    expect(msBetween('2026-10-06T08:30:00Z', '2026-10-06T08:32:00Z')).toBe(120_000)
  })

  it('reads a negative span when the second time comes first', () => {
    expect(msBetween('2026-10-06T08:32:00Z', '2026-10-06T08:30:00Z')).toBe(-120_000)
  })
})

describe('roundedDuration', () => {
  it.each([
    { name: 'nothing', ms: 0, read: { kind: 'lessThanAMinute' } },
    { name: '59 seconds', ms: 59_000, read: { kind: 'lessThanAMinute' } },
    { name: 'a minute', ms: 60_000, read: { kind: 'minutes', minutes: 1 } },
    { name: '89 seconds', ms: 89_000, read: { kind: 'minutes', minutes: 1 } },
    { name: '59 minutes', ms: 59 * 60_000, read: { kind: 'minutes', minutes: 59 } },
    { name: 'an hour', ms: 60 * 60_000, read: { kind: 'hours', hours: 1, minutes: 0 } },
    {
      name: 'an hour and five minutes',
      ms: 65 * 60_000,
      read: { kind: 'hours', hours: 1, minutes: 5 },
    },
  ])('rounds $name to whole minutes', ({ ms, read }) => {
    expect(roundedDuration(ms)).toEqual(read)
  })
})
