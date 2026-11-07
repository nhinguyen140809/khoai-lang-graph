import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { renderHookWithProviders } from '@/test/render'

import { useActivityThread } from '../useActivityThread'

describe('useActivityThread', () => {
  it('reads the thread whose latest run needs the user most', async () => {
    const { result } = renderHookWithProviders(() => useActivityThread(projectIds.mentor))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return
    expect(result.current.thread).toMatchObject({ id: threadIds.mentorMain })
  })

  it('reads no thread for a project without one', async () => {
    server.use(
      http.get(apiEndpoints.projectThreads.pattern, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )

    const { result } = renderHookWithProviders(() => useActivityThread(projectIds.mentor))

    await waitFor(() => {
      expect(result.current).toEqual({ state: 'success', thread: null })
    })
  })

  it('gives its error with a retry when the threads fail to load', async () => {
    const { result } = renderHookWithProviders(() => useActivityThread('missing'))

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })
})
