import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { useDebouncedValue } from '../useDebouncedValue'

describe('useDebouncedValue', () => {
  withFakeTimers()
  it('starts as the value it is given', () => {
    const { result } = renderHook(() => useDebouncedValue('first', 250))

    expect(result.current).toBe('first')
  })

  it('follows the value once it has not changed for the wait', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    advanceTimers(249)
    expect(result.current).toBe('a')

    advanceTimers(1)
    expect(result.current).toBe('b')
  })

  it('gives one new value for a burst of changes, the last one', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: '' },
    })

    for (const value of ['s', 'se', 'sea']) {
      rerender({ value })
      advanceTimers(100)
    }
    expect(result.current).toBe('')

    advanceTimers(250)
    expect(result.current).toBe('sea')
  })

  it('drops the change that waits when the component goes', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
