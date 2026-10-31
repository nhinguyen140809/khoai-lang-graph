import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { renderHookWithProviders } from '@/test/render'

import { runEventsUrl } from '../../run-events.api'
import type { RunEventType } from '../../run-events.types'
import { useRunStream } from '../useRunStream'

// The stream of the test: it keeps the listeners that the hook registers, and whether it was
// closed. jsdom has no EventSource, so the hook opens this one instead.
class TestEventSource {
  readonly url: string
  closed = false
  private readonly listeners = new Map<string, (message: MessageEvent<string>) => void>()

  constructor(url: string) {
    this.url = url
    sources.push(this)
  }

  addEventListener(type: string, listener: (message: MessageEvent<string>) => void) {
    this.listeners.set(type, listener)
  }

  close() {
    this.closed = true
  }

  /** Sends one event of the stream to the listener of its type, as the server would. */
  send(type: RunEventType, id: string, payload: unknown) {
    const message = { lastEventId: id, data: JSON.stringify(payload) } as MessageEvent<string>
    this.listeners.get(type)?.(message)
  }
}

// The streams the hook opened, oldest first.
const sources: TestEventSource[] = []

beforeEach(() => {
  sources.length = 0
  vi.stubGlobal('EventSource', TestEventSource)
})

/** The stream the hook opened, the latest one. */
function stream(): TestEventSource {
  return assertPresent(sources.at(-1), 'The hook opened a stream.')
}

/** Renders the hook on the stream of run 3 of the mentor thread. */
function renderStream() {
  return renderHookWithProviders(() => useRunStream(runIds.mentorMain3))
}

describe('useRunStream', () => {
  it('subscribes to the stream of the run, from its first event', () => {
    const { result } = renderStream()

    expect(stream().url).toBe(runEventsUrl(runIds.mentorMain3))
    expect(result.current).toEqual({
      status: 'streaming',
      activeNode: null,
      text: '',
      error: null,
      lastEventId: null,
    })
  })

  it('follows the events of the run', () => {
    const { result } = renderStream()

    act(() => {
      stream().send('node_start', '4', { node: 'analyst' })
    })
    expect(result.current.activeNode).toBe('analyst')

    act(() => {
      stream().send('token', '5', { node: 'analyst', text: 'Hello' })
    })
    act(() => {
      stream().send('token', '6', { node: 'analyst', text: ' there' })
    })
    expect(result.current.text).toBe('Hello there')
    expect(result.current.lastEventId).toBe('6')

    act(() => {
      stream().send('interrupt', '7', { node: 'checkpoint_analysis', payload: {} })
    })
    expect(result.current.status).toBe('interrupted')
    expect(stream().closed).toBe(false)
  })

  it('closes the stream when the run ends', () => {
    const { result } = renderStream()

    act(() => {
      stream().send('done', '8', {})
    })

    expect(result.current.status).toBe('succeeded')
    expect(result.current.activeNode).toBeNull()
    expect(stream().closed).toBe(true)
  })

  it('closes the stream when the run fails, with the message of the error', () => {
    const { result } = renderStream()

    act(() => {
      stream().send('error', '9', { message: 'The model provider failed.' })
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('The model provider failed.')
    expect(stream().closed).toBe(true)
  })

  it('ignores an event that does not parse', () => {
    const { result } = renderStream()

    act(() => {
      stream().send('node_start', '10', { node: 'analyst' })
    })
    act(() => {
      stream().send('node_start', '11', { node: 4 })
    })

    expect(result.current.activeNode).toBe('analyst')
    expect(result.current.lastEventId).toBe('10')
  })

  it('closes the stream when the hook unmounts', () => {
    const { unmount } = renderStream()

    unmount()

    expect(stream().closed).toBe(true)
  })

  it('opens the stream of another run without resetting the state', () => {
    const { result, rerender } = renderHookWithProviders(
      ({ runId }: { runId: string }) => useRunStream(runId),
      { initialProps: { runId: runIds.mentorMain3 } },
    )

    act(() => {
      stream().send('token', '12', { node: 'analyst', text: 'Hello' })
    })

    rerender({ runId: runIds.mentorMain2 })

    expect(sources).toHaveLength(2)
    expect(stream().url).toBe(runEventsUrl(runIds.mentorMain2))
    expect(result.current.text).toBe('Hello')
    expect(sources[0]?.closed).toBe(true)
  })
})
