import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { stubResizeObserver } from '@/test/browser'

import { useElementSize } from '../useElementSize'

/** The hook with an element handed to its ref, the way React hands it one. */
function renderMeasured() {
  const view = renderHook(() => useElementSize<HTMLDivElement>())
  act(() => {
    view.result.current.ref(document.createElement('div'))
  })
  return view
}

describe('useElementSize', () => {
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
