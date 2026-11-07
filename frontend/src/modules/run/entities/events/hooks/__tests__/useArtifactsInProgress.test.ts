import { act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { sleep } from '@/shared/lib/scheduling'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'

import type { RunStatus } from '../../../status/run-status.types'
import { useArtifactsInProgress } from '../useArtifactsInProgress'

// The events of the stream of a run, with the fields the API carries.
const NODE_START = {
  node: 'analyst',
  step_id: 's1',
  agent_role: 'analyst',
  stage: 'analysis',
  iteration: 0,
  persona_key: null,
}
const NODE_END = {
  node: 'analyst',
  step_id: 's1',
  status: 'succeeded',
  usage: {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
    cost_usd: 0,
    duration_ms: 0,
  },
}
const DELTA = (artifact_id: string) => ({
  artifact_id,
  delta: 'x',
  version: 1,
  item_id: null,
  item_key: null,
  change: 'item_created',
})
const CREATED = (artifact_id: string) => ({
  artifact_id,
  name: artifact_id,
  version: 1,
  kind: 'requirements_analysis',
})

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
      source?.emit('node_start', NODE_START, '1')
      source?.emit('artifact_delta', DELTA('a1'), '2')
    })
    expect([...result.current]).toEqual(['a1'])

    act(() => {
      source?.emit('node_end', NODE_END, '3')
    })
    expect([...result.current]).toEqual([])
  })

  it('shares the calls of a burst: one for the first event, one more for the rest', async () => {
    const { onWritten } = render('running')
    const [source] = openedEventSources()

    act(() => {
      for (const [index, id] of ['a1', 'a2', 'a3'].entries()) {
        source?.emit('artifact_created', CREATED(id), String(index))
      }
    })
    await waitFor(() => {
      expect(onWritten).toHaveBeenCalledTimes(2)
    })
    await sleep(50)
    expect(onWritten).toHaveBeenCalledTimes(2)

    act(() => {
      source?.emit('node_end', NODE_END, '9')
    })
    await waitFor(() => {
      expect(onWritten).toHaveBeenCalledTimes(3)
    })
  })

  it('does not call onWritten for a delta', async () => {
    const { onWritten } = render('running')

    act(() => {
      openedEventSources()[0]?.emit('artifact_delta', DELTA('a1'), '1')
    })
    await sleep(50)

    expect(onWritten).not.toHaveBeenCalled()
  })

  it('calls nothing after it is closed', async () => {
    const reload = vi.fn()
    const { unmount } = render('running', reload)
    const [source] = openedEventSources()
    act(() => {
      source?.emit('artifact_created', CREATED('a1'), '1')
    })
    unmount()
    await sleep(50)

    expect(source?.closed).toBe(true)
    expect(reload.mock.calls.length).toBeLessThanOrEqual(1)
  })
})
