import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { advanceTimers } from '@/test/steps'

import { useIdleVisibility } from '../useIdleVisibility'

const idleMs = 1000

let container: HTMLDivElement

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  container.remove()
})

function renderIdle(options: Partial<Parameters<typeof useIdleVisibility>[1]> = {}) {
  return renderHook(() => useIdleVisibility({ current: container }, { idleMs, ...options }))
}

function fire(type: string, target: Element = container) {
  fireEvent(target, new Event(type, { bubbles: type !== 'scroll' }))
}

describe('useIdleVisibility', () => {
  it('is shown at first, and hides after the idle time', () => {
    const { result } = renderIdle()
    expect(result.current.isShown).toBe(true)

    advanceTimers(idleMs - 1)
    expect(result.current.isShown).toBe(true)

    advanceTimers(1)
    expect(result.current.isShown).toBe(false)
  })

  it.each(['pointermove', 'touchstart', 'keydown', 'wheel'])(
    'shows again on %s, and hides after the idle time again',
    (type) => {
      const { result } = renderIdle()
      advanceTimers(idleMs)
      expect(result.current.isShown).toBe(false)

      fire(type)
      expect(result.current.isShown).toBe(true)

      advanceTimers(idleMs)
      expect(result.current.isShown).toBe(false)
    },
  )

  it('hears a scroll that happens in an element inside the container', () => {
    const inner = document.createElement('div')
    container.append(inner)
    const { result } = renderIdle()
    advanceTimers(idleMs)

    fire('scroll', inner)

    expect(result.current.isShown).toBe(true)
  })

  it('counts only the events it is given', () => {
    const { result } = renderIdle({ events: ['click'] })
    advanceTimers(idleMs)

    fire('pointermove')
    expect(result.current.isShown).toBe(false)

    fire('click')
    expect(result.current.isShown).toBe(true)
  })

  it('does not listen again for a new array of the same events', () => {
    const add = vi.spyOn(container, 'addEventListener')
    const ref = { current: container }
    const { rerender } = renderHook(() =>
      useIdleVisibility(ref, { idleMs, events: ['click', 'keydown'] }),
    )
    const calls = add.mock.calls.length

    rerender()

    expect(add.mock.calls).toHaveLength(calls)
  })

  it('waits for an action when it is hidden at first, and hides again after it', () => {
    const { result } = renderIdle({ isInitiallyShown: false })
    expect(result.current.isShown).toBe(false)
    advanceTimers(idleMs * 3)
    expect(result.current.isShown).toBe(false)

    fire('keydown')
    expect(result.current.isShown).toBe(true)

    advanceTimers(idleMs)
    expect(result.current.isShown).toBe(false)
  })

  it('shows again from `show`', () => {
    const { result } = renderIdle()
    advanceTimers(idleMs)

    act(() => {
      result.current.show()
    })

    expect(result.current.isShown).toBe(true)
  })

  it('stays while the pointer is on it, and hides after the pointer leaves', () => {
    const { result } = renderIdle()

    act(() => {
      result.current.holdProps.onPointerEnter()
    })
    advanceTimers(idleMs * 3)
    expect(result.current.isShown).toBe(true)

    act(() => {
      result.current.holdProps.onPointerLeave()
    })
    advanceTimers(idleMs)
    expect(result.current.isShown).toBe(false)
  })

  it('stays until every hold is released', () => {
    const { result } = renderIdle()
    act(() => {
      result.current.holdProps.onPointerEnter()
      result.current.holdProps.onFocus()
    })

    act(() => {
      result.current.holdProps.onPointerLeave()
    })
    advanceTimers(idleMs * 3)
    expect(result.current.isShown).toBe(true)

    act(() => {
      result.current.holdProps.onBlur()
    })
    advanceTimers(idleMs)
    expect(result.current.isShown).toBe(false)
  })

  it('stops listening and counting when it unmounts', () => {
    const remove = vi.spyOn(container, 'removeEventListener')
    const { unmount } = renderIdle()

    unmount()

    expect(remove).toHaveBeenCalledTimes(5)
    expect(vi.getTimerCount()).toBe(0)
  })
})
