import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useElementSize } from '../useElementSize'

type Callback = (entries: { borderBoxSize: { inlineSize: number; blockSize: number }[] }[]) => void

/** A ResizeObserver whose callbacks the test calls, the way the browser calls them on a resize. */
function stubResizeObserver() {
  const callbacks: Callback[] = []
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: Callback) {
        callbacks.push(callback)
      }
      observe() {
        // The test decides when a size arrives.
      }
      disconnect = disconnect
    },
  )
  const resizeTo = (width: number, height: number) => {
    act(() => {
      callbacks.at(-1)?.([{ borderBoxSize: [{ inlineSize: width, blockSize: height }] }])
    })
  }
  return { resizeTo, disconnect }
}

/** The hook with an element handed to its ref, the way React hands it one. */
function renderMeasured() {
  const view = renderHook(() => useElementSize<HTMLDivElement>())
  act(() => {
    view.result.current.ref(document.createElement('div'))
  })
  return view
}

describe('useElementSize', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has no size before the first measure', () => {
    stubResizeObserver()

    const { result } = renderMeasured()

    expect(result.current.size).toBeNull()
  })

  it('follows the size the observer reports', () => {
    const { resizeTo } = stubResizeObserver()
    const { result } = renderMeasured()

    resizeTo(320, 120)
    expect(result.current.size).toEqual({ width: 320, height: 120 })

    resizeTo(112, 36)
    expect(result.current.size).toEqual({ width: 112, height: 36 })
  })

  it('stops observing when the element goes', () => {
    const { disconnect } = stubResizeObserver()
    const { unmount } = renderMeasured()

    unmount()

    expect(disconnect).toHaveBeenCalled()
  })
})
