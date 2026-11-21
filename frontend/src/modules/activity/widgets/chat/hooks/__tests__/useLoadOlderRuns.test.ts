import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import type { OlderRuns } from '../../chat-state.types'
import { useLoadOlderRuns } from '../useLoadOlderRuns'

type Report = (entries: Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>[]) => void

let report: Report = () => undefined

class FakeObserver {
  constructor(callback: Report) {
    report = callback
  }
  observe() {
    // Nothing to watch: the test says when the marker is near.
  }
  unobserve() {
    // Nothing to stop.
  }
}

/** A viewport of the chat with a marker in it, whose height and scroll the test sets. */
function chatViewport() {
  const viewport = document.createElement('div')
  viewport.setAttribute('data-slot', 'message-scroller-viewport')
  const marker = document.createElement('div')
  viewport.append(marker)
  const state = { top: 0, height: 0 }
  Object.defineProperty(viewport, 'scrollTop', {
    get: () => state.top,
    set: (value: number) => {
      state.top = value
    },
  })
  Object.defineProperty(viewport, 'scrollHeight', { get: () => state.height })
  return { viewport, marker, state }
}

const loadable = (load: () => void, patch: Partial<OlderRuns> = {}): OlderRuns => ({
  hasMore: true,
  isLoading: false,
  isError: false,
  load,
  ...patch,
})

describe('useLoadOlderRuns', () => {
  withFakeTimers()
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each([
    ['there are earlier runs and the marker is near', {}, 1],
    ['there are none', { hasMore: false }, 0],
    ['they are loading already', { isLoading: true }, 0],
    ['they failed to load, which the reader asks to try again', { isError: true }, 0],
  ] as const)('loads the earlier runs when %s: %s time(s)', (_name, patch, calls) => {
    const { marker } = chatViewport()
    const load = vi.fn()
    renderHook(() => {
      useLoadOlderRuns({ current: marker }, loadable(load, patch), 'run-1')
    })

    act(() => {
      report([{ target: marker, isIntersecting: true }])
    })
    advanceTimers(150)

    expect(load).toHaveBeenCalledTimes(calls)
  })

  it('loads nothing when the marker goes far again before it has stayed near', () => {
    const { marker } = chatViewport()
    const load = vi.fn()
    renderHook(() => {
      useLoadOlderRuns({ current: marker }, loadable(load), 'run-1')
    })

    act(() => {
      report([{ target: marker, isIntersecting: true }])
    })
    advanceTimers(100)
    act(() => {
      report([{ target: marker, isIntersecting: false }])
    })
    advanceTimers(500)

    expect(load).not.toHaveBeenCalled()
  })

  it('does not load them while the marker is far', () => {
    const { marker } = chatViewport()
    const load = vi.fn()
    renderHook(() => {
      useLoadOlderRuns({ current: marker }, loadable(load), 'run-1')
    })

    expect(load).not.toHaveBeenCalled()
  })

  it('keeps the reader in place when earlier runs come in above, as far as the browser has not', () => {
    const { marker, state } = chatViewport()
    state.height = 1000
    state.top = 500
    const { rerender } = renderHook(
      ({ firstRunId }) => {
        useLoadOlderRuns({ current: marker }, loadable(vi.fn(), { hasMore: false }), firstRunId)
      },
      { initialProps: { firstRunId: 'run-2' } },
    )

    state.height = 1800
    rerender({ firstRunId: 'run-1' })
    expect(state.top).toBe(1300)

    // The browser keeps the place itself: nothing more is added.
    state.height = 2600
    state.top = 2100
    rerender({ firstRunId: 'run-0' })
    expect(state.top).toBe(2100)
  })

  it('leaves the scroll alone while the first run is the same', () => {
    const { marker, state } = chatViewport()
    state.height = 1000
    state.top = 500
    const { rerender } = renderHook(
      ({ height }) => {
        state.height = height
        useLoadOlderRuns({ current: marker }, loadable(vi.fn(), { hasMore: false }), 'run-2')
      },
      { initialProps: { height: 1000 } },
    )

    rerender({ height: 1400 })

    expect(state.top).toBe(500)
  })
})
