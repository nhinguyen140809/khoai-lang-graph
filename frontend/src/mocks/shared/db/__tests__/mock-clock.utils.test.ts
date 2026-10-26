import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isoTime, mockNow } from '../mock-clock.utils'
import { isoTimeCases } from './mock-clock.utils.data'

describe('isoTime', () => {
  it.each(isoTimeCases)('writes $name without milliseconds', ({ date, time }) => {
    expect(isoTime(new Date(date))).toBe(time)
  })
})

describe('mockNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('gives the current time as the fixtures write it', () => {
    vi.setSystemTime(new Date('2026-10-10T09:15:30.789Z'))

    expect(mockNow()).toBe('2026-10-10T09:15:30Z')
  })

  it('follows the clock', () => {
    vi.setSystemTime(new Date('2026-10-10T09:15:30Z'))
    const first = mockNow()

    vi.advanceTimersByTime(2000)

    expect(mockNow()).not.toBe(first)
    expect(mockNow()).toBe('2026-10-10T09:15:32Z')
  })
})
