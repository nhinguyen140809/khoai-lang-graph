import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

function setReducedMotion(isReduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches: isReduced,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  )
}

describe('usePrefersReducedMotion', () => {
  it('reads the setting of the system', () => {
    setReducedMotion(true)

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(true)
  })

  it('answers false while the system keeps its motion', () => {
    setReducedMotion(false)

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)
  })

  it('follows the setting when it changes', () => {
    let isReduced = false
    const listeners = new Set<() => void>()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        get matches() {
          return isReduced
        },
        addEventListener: (_name: string, listener: () => void) => {
          listeners.add(listener)
        },
        removeEventListener: (_name: string, listener: () => void) => {
          listeners.delete(listener)
        },
      })),
    )

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    isReduced = true
    act(() => {
      for (const listener of listeners) listener()
    })

    expect(result.current).toBe(true)
  })
})
