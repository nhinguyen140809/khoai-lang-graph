import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { pathParam } from '@/mocks/shared/http/request'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverError, serverErrorOn } from '@/test/msw'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'

import { useProjectRunResult } from '../useProjectRunResult'
import { emptyPage, latestRunOf, twoThreads } from './useProjectRunResult.data'

// The threads of the project and the latest run of each of them, as the API answers them.
function answerWith(threads: typeof twoThreads) {
  return [
    http.get(apiEndpoints.projectThreads.pattern, () =>
      HttpResponse.json({ items: threads, next_cursor: null }),
    ),
    http.get(apiEndpoints.threadRuns.pattern, ({ params }) => {
      const thread = threads.find(({ id }) => id === pathParam(params, 'threadId'))
      return HttpResponse.json({
        items: thread === undefined ? [] : [latestRunOf(thread)],
        next_cursor: null,
      })
    }),
  ]
}

describe('useProjectRunResult', () => {
  it('is pending while the threads load', () => {
    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))

    expect(result.current.state).toBe('pending')
  })

  it('shows the latest run of the thread of the project', async () => {
    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current).toMatchObject({ run: { id: runIds.mentorMain3 } })
  })

  it('shows no run for a project without a thread', async () => {
    server.use(http.get(apiEndpoints.projectThreads.pattern, () => HttpResponse.json(emptyPage)))

    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))

    await waitFor(() => {
      expect(result.current).toEqual({ state: 'success', run: null, threads: [] })
    })
  })

  it('shows the run of the thread that needs the user most', async () => {
    server.use(...answerWith(twoThreads))

    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current).toMatchObject({ run: { thread_id: 'waits', status: 'interrupted' } })
  })

  it('fails when the threads fail to load, and loads them again on retry', async () => {
    let isFailing = true
    server.use(
      http.get(apiEndpoints.projectThreads.pattern, () =>
        isFailing ? serverError() : HttpResponse.json({ items: twoThreads, next_cursor: null }),
      ),
      ...answerWith(twoThreads).slice(1),
    )
    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })

    isFailing = false
    act(() => {
      if (result.current.state === 'error') result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
  })

  it('fails when the latest run fails to load', async () => {
    server.use(
      serverErrorOn(
        HttpMethod.Get,
        apiEndpoints.threadRuns.path({ threadId: threadIds.mentorMain }),
      ),
    )

    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor))

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })

  it('keeps the status shown when loading it again fails', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHookWithProviders(() => useProjectRunResult(projectIds.mentor), {
      queryClient,
    })
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })

    server.use(http.get(apiEndpoints.threadRuns.pattern, () => serverError()))
    await act(() => queryClient.invalidateQueries())

    expect(result.current.state).toBe('success')
  })
})
