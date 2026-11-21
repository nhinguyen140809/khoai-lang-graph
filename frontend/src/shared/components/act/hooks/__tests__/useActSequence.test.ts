import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { actDwellRounds, acts } from '../../act.constants'
import { useActSequence } from '../useActSequence'

const dwellMs = (acts.write?.loopMs ?? 0) * actDwellRounds

describe('useActSequence', () => {
  withFakeTimers()

  afterEach(() => {
    vi.useRealTimers()
  })

  it('gives none when no act of the list is drawn', () => {
    const { result } = renderHook(() => useActSequence(['nothing'], true))

    expect(result.current).toBeNull()
  })

  it('stays with one act for ever', () => {
    const { result } = renderHook(() => useActSequence(['write'], true))

    advanceTimers(dwellMs * 3)

    expect(result.current).toBe('write')
  })

  it('goes from act to act after the rounds of each, and again from the first', () => {
    const { result } = renderHook(() => useActSequence(['write', 'typing'], true))
    expect(result.current).toBe('write')

    advanceTimers(dwellMs)
    expect(result.current).toBe('typing')

    advanceTimers((acts.typing?.loopMs ?? 0) * actDwellRounds)
    expect(result.current).toBe('write')
  })

  it('waits while it is not running', () => {
    const { result } = renderHook(() => useActSequence(['write', 'typing'], false))

    advanceTimers(dwellMs * 2)

    expect(result.current).toBe('write')
  })
})
