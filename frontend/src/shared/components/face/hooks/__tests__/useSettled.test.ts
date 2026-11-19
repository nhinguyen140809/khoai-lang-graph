import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { swapFallbackMs } from '../../face.constants'
import { useSettled } from '../useSettled'

describe('useSettled', () => {
  withFakeTimers()

  it('has the value at once when nothing changes', () => {
    const { result } = renderHook(() => useSettled('idle'))

    expect(result.current).toMatchObject({ settled: 'idle', isChanging: false })
  })

  it('holds the old value while a change is covered, and takes the new one when it is settled', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value), {
      initialProps: { value: 'idle' },
    })

    rerender({ value: 'happy' })
    expect(result.current).toMatchObject({ settled: 'idle', isChanging: true })

    act(() => {
      result.current.settle()
    })
    expect(result.current).toMatchObject({ settled: 'happy', isChanging: false })
  })

  it('takes the new value after a while if nothing settles it', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value), {
      initialProps: { value: 'idle' },
    })

    rerender({ value: 'happy' })
    advanceTimers(swapFallbackMs)

    expect(result.current.settled).toBe('happy')
  })
})
