import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'

import { runEventsUrl } from '../../run-events.api'
import { useRunStream } from '../useRunStream'

// The streams the hook opened, oldest first.
const sources = openedEventSources()

/** The stream the hook opened, the latest one. */
function stream() {
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
      stream().emit('node_start', { node: 'analyst' }, '4')
    })
    expect(result.current.activeNode).toBe('analyst')

    act(() => {
      stream().emit('token', { node: 'analyst', text: 'Hello' }, '5')
    })
    act(() => {
      stream().emit('token', { node: 'analyst', text: ' there' }, '6')
    })
    expect(result.current.text).toBe('Hello there')
    expect(result.current.lastEventId).toBe('6')

    act(() => {
      stream().emit('interrupt', { node: 'checkpoint_analysis', payload: {} }, '7')
    })
    expect(result.current.status).toBe('interrupted')
    expect(stream().closed).toBe(false)
  })

  it('closes the stream when the run ends', () => {
    const { result } = renderStream()

    act(() => {
      stream().emit('done', {}, '8')
    })

    expect(result.current.status).toBe('succeeded')
    expect(result.current.activeNode).toBeNull()
    expect(stream().closed).toBe(true)
  })

  it('closes the stream when the run fails, with the message of the error', () => {
    const { result } = renderStream()

    act(() => {
      stream().emit('error', { message: 'The model provider failed.' }, '9')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('The model provider failed.')
    expect(stream().closed).toBe(true)
  })

  it('ignores an event that does not parse', () => {
    const { result } = renderStream()

    act(() => {
      stream().emit('node_start', { node: 'analyst' }, '10')
    })
    act(() => {
      stream().emit('node_start', { node: 4 }, '11')
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
      stream().emit('token', { node: 'analyst', text: 'Hello' }, '12')
    })

    rerender({ runId: runIds.mentorMain2 })

    expect(sources).toHaveLength(2)
    expect(stream().url).toBe(runEventsUrl(runIds.mentorMain2))
    expect(result.current.text).toBe('Hello')
    expect(sources[0]?.closed).toBe(true)
  })
})
