import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useOpenWhileWorking } from '../useOpenWhileWorking'

describe('useOpenWhileWorking', () => {
  it('starts open for work in progress and closed for work that is done', () => {
    expect(renderHook(() => useOpenWhileWorking(true)).result.current[0]).toBe(true)
    expect(renderHook(() => useOpenWhileWorking(false)).result.current[0]).toBe(false)
  })

  it('closes when the work is done, and opens again when work begins', () => {
    const { result, rerender } = renderHook(({ isWorking }) => useOpenWhileWorking(isWorking), {
      initialProps: { isWorking: true },
    })

    rerender({ isWorking: false })
    expect(result.current[0]).toBe(false)

    rerender({ isWorking: true })
    expect(result.current[0]).toBe(true)
  })

  it('lets the reader open or close it until the work changes', () => {
    const { result, rerender } = renderHook(({ isWorking }) => useOpenWhileWorking(isWorking), {
      initialProps: { isWorking: true },
    })

    act(() => {
      result.current[1](false)
    })
    expect(result.current[0]).toBe(false)

    rerender({ isWorking: true })
    expect(result.current[0]).toBe(false)

    rerender({ isWorking: false })
    act(() => {
      result.current[1](true)
    })
    expect(result.current[0]).toBe(true)
  })
})
