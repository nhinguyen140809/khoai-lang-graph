import { describe, expect, it } from 'vitest'

import { formatRelativeTime } from '../relative-time.utils'

const now = new Date('2026-10-10T12:00:00Z')

describe('formatRelativeTime', () => {
  it.each([
    ['2026-10-10T11:59:40Z', 'just now'],
    ['2026-10-10T11:58:00Z', '2 min ago'],
    ['2026-10-10T07:00:00Z', '5 h ago'],
    ['2026-10-09T09:00:00Z', 'yesterday'],
    ['2026-10-07T09:00:00Z', '3 days ago'],
    ['2026-10-01T09:00:00Z', 'Oct 1'],
    ['2025-12-24T09:00:00Z', 'Dec 24, 2025'],
  ])('formats %s as "%s"', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected)
  })
})
