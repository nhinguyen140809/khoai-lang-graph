import { act, renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildMockRun } from '@/mocks/runs/runs.fixtures'
import { PROJECT_IDS, RUN_IDS, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'
import { buildMockThread } from '@/mocks/threads/threads.fixtures'
import { type RunStatus, useLatestRun } from '@/modules/run/entities/@x/project'
import { useProjectThreads } from '@/modules/thread/entities/@x/project'
import { openedEventSources } from '@/test/event-source.utils'
import { TestProviders } from '@/test/TestProviders'

import { STREAM_REOPEN_MS } from '../../constants/run-status-stream.constants'
import { useRunStatusStream } from '../useRunStatusStream'

afterEach(() => {
  vi.useRealTimers()
})

// The latest run of a thread, as the status of its project reads it, while its stream is followed.
function useFollowedRun(threadId: string) {
  const run = useLatestRun(threadId)
  useRunStatusStream(run.data)
  return run
}

async function followedStream() {
  const hook = renderHook(() => useFollowedRun(THREAD_IDS.mentorMain), { wrapper: TestProviders })
  await waitFor(() => {
    expect(openedEventSources()).toHaveLength(1)
  })
  return { ...hook, source: openedEventSources()[0] }
}

describe('useRunStatusStream', () => {
  it('follows the stream of an unfinished run after its latest event, and loads the run again at an event', async () => {
    const { result, source } = await followedStream()
    // Run 3 of the mentor thread waits for a review after its event 246.
    expect(source?.url).toMatch(
      new RegExp(`/api/v1/runs/${RUN_IDS.mentorMain3}/stream\\?after=246$`),
    )

    server.use(
      http.get('/api/v1/threads/:threadId/runs', () =>
        HttpResponse.json({
          items: [
            buildMockRun({
              id: RUN_IDS.mentorMain3,
              thread_id: THREAD_IDS.mentorMain,
              project_id: PROJECT_IDS.mentor,
              number: 3,
              status: 'succeeded',
            }),
          ],
          next_cursor: null,
        }),
      ),
    )
    act(() => {
      source?.emit('done', { status: 'succeeded' }, '247')
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    expect(source?.closed).toBe(true)
  })

  it('loads the run once more for an event that comes while the run loads', async () => {
    const { result, source } = await followedStream()
    // The first load answers late, with the run as it was before the run ended.
    let loads = 0
    server.use(
      http.get('/api/v1/threads/:threadId/runs', async () => {
        loads += 1
        const first = loads === 1
        if (first) await delay(50)
        return HttpResponse.json({
          items: [
            buildMockRun({
              id: RUN_IDS.mentorMain3,
              thread_id: THREAD_IDS.mentorMain,
              project_id: PROJECT_IDS.mentor,
              number: 3,
              status: first ? 'running' : 'succeeded',
            }),
          ],
          next_cursor: null,
        })
      }),
    )

    act(() => {
      source?.emit('node_end', { node: 'analyst' }, '247')
      source?.emit('done', { status: 'succeeded' }, '248')
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    expect(loads).toBe(2)
  })

  it('loads the threads again only when the status of the run changes', async () => {
    // The mentor thread and its run 3, which waits for a review, as the API answers them now.
    let status: RunStatus = 'interrupted'
    let runLoads = 0
    let threadLoads = 0
    server.use(
      http.get('/api/v1/threads/:threadId/runs', () => {
        runLoads += 1
        return HttpResponse.json({
          items: [
            buildMockRun({
              id: RUN_IDS.mentorMain3,
              thread_id: THREAD_IDS.mentorMain,
              project_id: PROJECT_IDS.mentor,
              number: 3,
              status,
            }),
          ],
          next_cursor: null,
        })
      }),
      http.get('/api/v1/projects/:projectId/threads', () => {
        threadLoads += 1
        return HttpResponse.json({
          items: [
            buildMockThread({
              id: THREAD_IDS.mentorMain,
              project_id: PROJECT_IDS.mentor,
              latest_run_status: status,
            }),
          ],
          next_cursor: null,
        })
      }),
    )
    renderHook(
      () => {
        useProjectThreads(PROJECT_IDS.mentor)
        return useFollowedRun(THREAD_IDS.mentorMain)
      },
      { wrapper: TestProviders },
    )
    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(1)
      expect(threadLoads).toBe(1)
    })
    const source = openedEventSources()[0]

    // A step that ends leaves the run waiting, as its thread already shows.
    act(() => {
      source?.emit('node_end', { node: 'analyst' }, '247')
    })
    await waitFor(() => {
      expect(runLoads).toBe(2)
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(threadLoads).toBe(1)

    // The end of the run changes its status, which its thread shows only once it loads again.
    status = 'succeeded'
    act(() => {
      source?.emit('done', { status: 'succeeded' }, '248')
    })
    await waitFor(() => {
      expect(threadLoads).toBe(2)
    })
  })

  it('opens the stream again a moment after its connection fails for good', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { source } = await followedStream()

    act(() => {
      source?.fail()
    })
    act(() => {
      vi.advanceTimersByTime(STREAM_REOPEN_MS)
    })

    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(2)
    })
    expect(openedEventSources()[1]?.closed).toBe(false)
  })

  it('opens no stream for a run that ended', async () => {
    const { result } = renderHook(() => useFollowedRun(THREAD_IDS.campusMain), {
      wrapper: TestProviders,
    })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })
    expect(openedEventSources()).toHaveLength(0)
  })
})
