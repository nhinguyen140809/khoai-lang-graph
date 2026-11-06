import { useQuery } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { costQueryMeta } from '@/shared/api/query-client'
import { sleep } from '@/shared/lib/scheduling'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'
import { advanceTimers } from '@/test/steps'

import { useLatestRun } from '../../../runs/hooks/useRunQueries'
import type { RunStatus } from '../../../status/run-status.types'
import { streamReopenMs } from '../../run-events.constants'
import { useRunStatusEvents } from '../useRunStatusEvents'

// The events of the stream of a run, with the fields the API carries.
const NODE_START = {
  node: 'analyst',
  step_id: 's66',
  agent_role: 'analyst',
  stage: 'analysis',
  iteration: 0,
  persona_key: null,
}
const NODE_END = {
  node: 'analyst',
  step_id: 's66',
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
const TOKEN = { node: 'analyst', text: 'Hello', step_id: 's66' }
const DONE = { status: 'succeeded' }

// Run 3 of the mentor thread, with the status the API answers for it now.
function mentorRun(status: RunStatus, lastEventId = 246) {
  return buildRun({
    id: runIds.mentorMain3,
    thread_id: threadIds.mentorMain,
    project_id: projectIds.mentor,
    number: 3,
    status,
    last_event_id: lastEventId,
  })
}

function answerRunWith(status: RunStatus, lastEventId?: number) {
  return http.get(apiEndpoints.threadRuns.pattern, () =>
    HttpResponse.json({ items: [mentorRun(status, lastEventId)], next_cursor: null }),
  )
}

// The latest run of a thread, as a screen reads it, while the events of its stream are followed.
function useFollowedRun(threadId: string, onReloaded = vi.fn()) {
  const run = useLatestRun(threadId)
  useRunStatusEvents(run.data, onReloaded)
  return run
}

async function followedStream(onReloaded = vi.fn()) {
  const hook = renderHookWithProviders(() => useFollowedRun(threadIds.mentorMain, onReloaded))
  await waitFor(() => {
    expect(openedEventSources()).toHaveLength(1)
  })
  return { ...hook, source: openedEventSources()[0] }
}

// Counts how often a query of the cost, and one without a cost, load while the run is followed.
function costQueries(counts: { cost: number; other: number }) {
  return {
    cost: {
      queryKey: ['cost'],
      queryFn: () => (counts.cost += 1),
      meta: costQueryMeta,
    },
    other: { queryKey: ['other'], queryFn: () => (counts.other += 1) },
  }
}

// The followed run beside a query that holds a cost and one that does not, both counted.
async function followedStreamWithCosts(counts: { cost: number; other: number }) {
  const queries = costQueries(counts)
  const hook = renderHookWithProviders(() => {
    useQuery(queries.cost)
    useQuery(queries.other)
    return useFollowedRun(threadIds.mentorMain)
  })
  await waitFor(() => {
    expect(openedEventSources()).toHaveLength(1)
    expect(counts.cost).toBe(1)
  })
  return { ...hook, source: openedEventSources()[0] }
}

describe('useRunStatusEvents', () => {
  it('follows the stream of an unfinished run', async () => {
    const { source } = await followedStream()

    expect(source?.url).toContain(`/runs/${runIds.mentorMain3}/stream`)
  })

  it('loads the run again at the end of the run, tells who reads it, and closes the stream', async () => {
    const onReloaded = vi.fn()
    const { result, source } = await followedStream(onReloaded)
    server.use(answerRunWith('succeeded'))

    act(() => {
      source?.emit('done', DONE, '247')
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    await waitFor(() => {
      expect(onReloaded).toHaveBeenCalledWith(expect.objectContaining({ status: 'succeeded' }))
    })
    expect(source?.closed).toBe(true)
  })

  it('loads the run again at an event that changes a step, and not at a token', async () => {
    const onReloaded = vi.fn()
    const { source } = await followedStream(onReloaded)
    server.use(answerRunWith('interrupted'))

    act(() => {
      source?.emit('token', TOKEN, '247')
    })
    await sleep(50)
    expect(onReloaded).not.toHaveBeenCalled()

    act(() => {
      source?.emit('node_end', NODE_END, '248')
    })
    await waitFor(() => {
      expect(onReloaded).toHaveBeenCalledOnce()
    })
  })

  it('loads the run once more for an event that comes while the run loads', async () => {
    const { result, source } = await followedStream()
    // The first load answers late, with the run as it was before the run ended.
    let loads = 0
    server.use(
      http.get(apiEndpoints.threadRuns.pattern, async () => {
        loads += 1
        const isFirst = loads === 1
        if (isFirst) await delay(50)
        return HttpResponse.json({
          items: [mentorRun(isFirst ? 'running' : 'succeeded')],
          next_cursor: null,
        })
      }),
    )

    act(() => {
      source?.emit('node_end', NODE_END, '247')
      source?.emit('done', { status: 'succeeded' }, '248')
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    expect(loads).toBe(2)
  })

  it('tells nobody of a load that ends after the stream closed', async () => {
    const onReloaded = vi.fn()
    const { source, unmount } = await followedStream(onReloaded)
    server.use(
      http.get(apiEndpoints.threadRuns.pattern, async () => {
        await delay(50)
        return HttpResponse.json({ items: [mentorRun('running')], next_cursor: null })
      }),
    )

    act(() => {
      source?.emit('node_end', NODE_END, '247')
    })
    unmount()
    await sleep(150)

    expect(onReloaded).not.toHaveBeenCalled()
  })

  it('opens the stream again a moment after its connection fails for good', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { source } = await followedStream()

    act(() => {
      source?.fail()
    })
    advanceTimers(streamReopenMs)

    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(2)
    })
    expect(openedEventSources()[1]?.closed).toBe(false)
  })

  it('opens the stream again after the latest event that the run loaded with', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result, source } = await followedStream()
    server.use(answerRunWith('interrupted', 250))
    act(() => {
      source?.emit('node_end', NODE_END, '250')
    })
    await waitFor(() => {
      expect(result.current.data?.last_event_id).toBe(250)
    })

    act(() => {
      source?.fail()
    })
    advanceTimers(streamReopenMs)

    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(2)
    })
    expect(openedEventSources()[1]?.url).toMatch(/after=250$/)
  })

  it('opens no stream for a run that ended', async () => {
    const { result } = renderHookWithProviders(() => useFollowedRun(threadIds.campusMain))

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    expect(openedEventSources()).toHaveLength(0)
  })
  it('loads the queries that hold a cost again at an event that changes a cost, and no other', async () => {
    const counts = { cost: 0, other: 0 }
    const { source } = await followedStreamWithCosts(counts)
    server.use(answerRunWith('interrupted'))

    act(() => {
      source?.emit('node_end', NODE_END, '247')
    })

    await waitFor(() => {
      expect(counts.cost).toBe(2)
    })
    expect(counts.other).toBe(1)
  })

  it('leaves the queries that hold a cost as they are at an event that changes none', async () => {
    const counts = { cost: 0, other: 0 }
    const { source } = await followedStreamWithCosts(counts)
    server.use(answerRunWith('running'))

    act(() => {
      source?.emit('node_start', NODE_START, '247')
    })
    await sleep(100)

    expect(counts.cost).toBe(1)
  })

  it('loads the queries that hold a cost once for a burst of events', async () => {
    const counts = { cost: 0, other: 0 }
    const { source } = await followedStreamWithCosts(counts)
    server.use(answerRunWith('interrupted'))

    act(() => {
      source?.emit('node_end', NODE_END, '247')
      source?.emit('node_end', NODE_END, '248')
      source?.emit('node_end', NODE_END, '249')
    })
    await sleep(150)

    // Once at the first load, once for the first event, and once more for the two that follow it.
    await waitFor(() => {
      expect(counts.cost).toBe(3)
    })
    await sleep(100)
    expect(counts.cost).toBe(3)
  })
})
