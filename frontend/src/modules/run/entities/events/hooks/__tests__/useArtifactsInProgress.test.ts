import { act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { sleep } from '@/shared/lib/timing'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'

import type { RunStatus } from '../../../status/run-status.types'
import { useArtifactsInProgress } from '../useArtifactsInProgress'

function render(status: RunStatus, onWritten = vi.fn()) {
  const hook = renderHookWithProviders(
    ({ status: current }: { status: RunStatus }) =>
      useArtifactsInProgress({ id: runIds.mentorMain3, status: current }, onWritten),
    { initialProps: { status } },
  )
  return { ...hook, onWritten }
}

describe('useArtifactsInProgress', () => {
  it('opens no stream while the run is not running', () => {
    render('interrupted')

    expect(openedEventSources()).toHaveLength(0)
  })

  it('follows the stream of a running run from its first event', () => {
    render('running')

    expect(openedEventSources()[0]?.url).toMatch(/\/runs\/.+\/stream$/)
  })

  it('gives the artifacts that the node writes, and none once it ends', () => {
    const { result } = render('running')
    const [source] = openedEventSources()

    act(() => {
      source?.emit('node_start', { node: 'analyst' }, '1')
      source?.emit('artifact_delta', { artifact_id: 'a1', delta: 'x' }, '2')
    })
    expect([...result.current]).toEqual(['a1'])

    act(() => {
      source?.emit('node_end', { node: 'analyst' }, '3')
    })
    expect([...result.current]).toEqual([])
  })

  it('shares the calls of a burst: one for the first event, one more for the rest', async () => {
    const { onWritten } = render('running')
    const [source] = openedEventSources()

    act(() => {
      for (const [index, id] of ['a1', 'a2', 'a3'].entries()) {
        source?.emit('artifact_created', { artifact_id: id, name: id, version: 1 }, String(index))
      }
    })
    await waitFor(() => {
      expect(onWritten).toHaveBeenCalledTimes(2)
    })
    await sleep(50)
    expect(onWritten).toHaveBeenCalledTimes(2)

    act(() => {
      source?.emit('node_end', { node: 'analyst' }, '9')
    })
    await waitFor(() => {
      expect(onWritten).toHaveBeenCalledTimes(3)
    })
  })

  it('does not call onWritten for a delta', async () => {
    const { onWritten } = render('running')

    act(() => {
      openedEventSources()[0]?.emit('artifact_delta', { artifact_id: 'a1', delta: 'x' }, '1')
    })
    await sleep(50)

    expect(onWritten).not.toHaveBeenCalled()
  })

  it('calls nothing after it is closed', async () => {
    const reload = vi.fn()
    const { unmount } = render('running', reload)
    const [source] = openedEventSources()
    act(() => {
      source?.emit('artifact_created', { artifact_id: 'a1', name: 'A', version: 1 }, '1')
    })
    unmount()
    await sleep(50)

    expect(source?.closed).toBe(true)
    expect(reload.mock.calls.length).toBeLessThanOrEqual(1)
  })
})
