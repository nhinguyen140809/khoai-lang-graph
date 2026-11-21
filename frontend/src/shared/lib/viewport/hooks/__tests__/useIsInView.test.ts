import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIsInView } from '../useIsInView'

type Report = (entries: Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>[]) => void

let report: Report = () => undefined
const observed = new Set<Element>()

class FakeObserver {
  constructor(callback: Report) {
    report = callback
  }
  observe(element: Element) {
    observed.add(element)
  }
  unobserve(element: Element) {
    observed.delete(element)
  }
}

describe('useIsInView', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    observed.clear()
  })

  it('is true until the browser says that the element is out of view, and follows what it says', () => {
    const element = document.createElement('div')
    const { result } = renderHook(() => useIsInView({ current: element }))

    expect(result.current).toBe(true)
    expect(observed.has(element)).toBe(true)

    act(() => {
      report([{ target: element, isIntersecting: false }])
    })
    expect(result.current).toBe(false)

    act(() => {
      report([{ target: element, isIntersecting: true }])
    })
    expect(result.current).toBe(true)
  })

  it('stops watching an element when it goes away', () => {
    const element = document.createElement('div')
    const { unmount } = renderHook(() => useIsInView({ current: element }))

    unmount()

    expect(observed.has(element)).toBe(false)
  })

  it('is false until the browser says that it is in view, when asked to wait for it', () => {
    const element = document.createElement('div')
    const { result } = renderHook(() =>
      useIsInView({ current: element }, { margin: '600px', initial: false }),
    )

    expect(result.current).toBe(false)

    act(() => {
      report([{ target: element, isIntersecting: true }])
    })
    expect(result.current).toBe(true)
  })

  it('is true where the browser cannot say', () => {
    vi.unstubAllGlobals()
    const element = document.createElement('div')
    const { result } = renderHook(() => useIsInView({ current: element }, { initial: false }))

    expect(result.current).toBe(true)
  })
})
