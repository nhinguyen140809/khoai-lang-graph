import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { advanceTimers } from '@/test/steps'

import { useNow } from '../useNow'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-10-10T12:00:00Z') })
})

describe('useNow', () => {
  it('gives the current time, refreshed every interval', () => {
    const { result } = renderHook(() => useNow(1000))
    expect(result.current.toISOString()).toBe('2026-10-10T12:00:00.000Z')

    advanceTimers(999)
    expect(result.current.toISOString()).toBe('2026-10-10T12:00:00.000Z')

    advanceTimers(1)
    expect(result.current.toISOString()).toBe('2026-10-10T12:00:01.000Z')
  })
})
