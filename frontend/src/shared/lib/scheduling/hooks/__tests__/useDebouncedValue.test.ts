import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from '../useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts as the value it is given', () => {
    const { result } = renderHook(() => useDebouncedValue('first', 250))

    expect(result.current).toBe('first')
  })

  it('follows the value once it has not changed for the wait', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(249)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('gives one new value for a burst of changes, the last one', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: '' },
    })

    for (const value of ['s', 'se', 'sea']) {
      rerender({ value })
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(250)
    })
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
