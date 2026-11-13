import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-stubs'
import { advanceTimers } from '@/test/steps'

import { useKeptScroll } from '../useKeptScroll'

/** A scrolling element with the sizes that jsdom does not lay out. */
function scroller(content = 1000, view = 200) {
  const element = document.createElement('div')
  Object.defineProperty(element, 'scrollHeight', { value: content })
  Object.defineProperty(element, 'clientHeight', { value: view })
  return element
}

function scrollTo(element: HTMLElement, offset: number) {
  element.scrollTop = offset
  element.dispatchEvent(new Event('scroll'))
}

/** Shows an element, the way React hands it to a ref, and returns what takes it away. */
function show(
  attach: (element: HTMLElement | null) => (() => void) | undefined,
  element: HTMLElement,
) {
  return attach(element)
}

describe('useKeptScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setPathname('/projects/p1/documents/d1')
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('puts a scroller back where the reader left it', () => {
    const first = renderHook(() => useKeptScroll('page'))
    const before = scroller()
    const leave = show(first.result.current, before)
    scrollTo(before, 340)
    leave?.()

    const again = renderHook(() => useKeptScroll('page'))
    const after = scroller()
    show(again.result.current, after)
    advanceTimers(50)

    expect(after.scrollTop).toBe(340)
  })

  it('leaves a scroller that was never scrolled alone', () => {
    const { result } = renderHook(() => useKeptScroll('page'))
    const element = scroller()
    show(result.current, element)
    advanceTimers(600)

    expect(element.scrollTop).toBe(0)
  })

  it('keeps a scroller that was at its end at its end, even when more was added', () => {
    const first = renderHook(() => useKeptScroll('chat', { from: 'end' }))
    const before = scroller(1000, 200)
    const leave = show(first.result.current, before)
    scrollTo(before, 800)
    leave?.()

    const again = renderHook(() => useKeptScroll('chat', { from: 'end' }))
    const after = scroller(1500, 200)
    show(again.result.current, after)
    advanceTimers(600)

    // At the end before, so nothing is put back: the scroller places itself at the end.
    expect(after.scrollTop).toBe(0)
  })

  it('puts a scroller that was above its end the same distance from the end', () => {
    const first = renderHook(() => useKeptScroll('chat', { from: 'end' }))
    const before = scroller(1000, 200)
    const leave = show(first.result.current, before)
    scrollTo(before, 500)
    leave?.()

    const again = renderHook(() => useKeptScroll('chat', { from: 'end' }))
    const after = scroller(1500, 200)
    show(again.result.current, after)
    advanceTimers(50)

    // 300 from the end before, so 1300 - 300 now.
    expect(after.scrollTop).toBe(1000)
  })

  it('stops putting the scroller back once the reader scrolls it', () => {
    const first = renderHook(() => useKeptScroll('page'))
    const before = scroller()
    const leave = show(first.result.current, before)
    scrollTo(before, 340)
    leave?.()

    const again = renderHook(() => useKeptScroll('page'))
    const after = scroller()
    show(again.result.current, after)
    after.dispatchEvent(new Event('wheel'))
    scrollTo(after, 10)
    advanceTimers(600)

    expect(after.scrollTop).toBe(10)
  })

  it('keeps the offset of each page apart', () => {
    const first = renderHook(() => useKeptScroll('page'))
    const element = scroller()
    const leave = show(first.result.current, element)
    scrollTo(element, 340)
    leave?.()

    setPathname('/projects/p1/documents/d2')
    const other = renderHook(() => useKeptScroll('page'))
    const fresh = scroller()
    show(other.result.current, fresh)
    advanceTimers(600)

    expect(fresh.scrollTop).toBe(0)
  })
})
