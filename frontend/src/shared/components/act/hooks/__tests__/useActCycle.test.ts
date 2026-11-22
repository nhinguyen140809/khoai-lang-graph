import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { actDwellRounds, actFadeMs, acts } from '../../act.constants'
import { useActCycle } from '../useActCycle'

const dwellMs = (acts.write?.loopMs ?? 0) * actDwellRounds

describe('useActCycle', () => {
  withFakeTimers()

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows none when no act of the list is drawn', () => {
    const { result } = renderHook(() => useActCycle(['nothing'], true))

    expect(result.current.shown).toBeNull()
  })

  it('goes to the next act after the rounds of the first and the time that the old one takes to go', () => {
    const { result } = renderHook(() => useActCycle(['write', 'typing'], true))
    expect(result.current.shown).toBe('write')

    act(() => {
      advanceTimers(dwellMs)
    })
    expect(result.current.shown).toBe('write')

    act(() => {
      advanceTimers(actFadeMs.out)
    })
    expect(result.current.shown).toBe('typing')
    expect(result.current.swaps).toBe(1)
  })

  it('waits while it is not running', () => {
    const { result } = renderHook(() => useActCycle(['write', 'typing'], false))

    act(() => {
      advanceTimers(dwellMs * 2)
    })

    expect(result.current.shown).toBe('write')
  })
})
