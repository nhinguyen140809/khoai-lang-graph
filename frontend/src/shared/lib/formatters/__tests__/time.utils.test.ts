import { describe, expect, it } from 'vitest'

import { formatDate, formatDateTime, formatDuration, formatRelativeTime } from '../time.utils'
import { dateCases, dateTimeCases, durationCases, now, relativeTimeCases } from './time.utils.data'

describe('formatRelativeTime', () => {
  it.each(relativeTimeCases)('formats %s as %j', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected)
  })
})

describe('formatDate', () => {
  it.each(dateCases)('formats %s as %j', (iso, expected) => {
    expect(formatDate(iso)).toBe(expected)
  })

  it('takes a Date as well as a text', () => {
    expect(formatDate(new Date(2026, 9, 1))).toBe('Oct 1, 2026')
  })
})

describe('formatDateTime', () => {
  it.each(dateTimeCases)('formats %s as %j', (iso, expected) => {
    expect(formatDateTime(iso)).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each(durationCases)('writes $name as $text', ({ ms, text }) => {
    expect(formatDuration(ms)).toBe(text)
  })
})
