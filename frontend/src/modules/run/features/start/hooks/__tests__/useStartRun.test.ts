import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { startedRunId } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { recordRequests, serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'
import { itToastsOnResult } from '@/test/suites'

import { useStartRun } from '../useStartRun'

// The thread whose runs the hook starts.
const threadId = 'thread 1'

describe('useStartRun', () => {
  it('starts a run of the thread, with the prompt as its input', async () => {
    const requests = recordRequests()
    const { result } = renderHookWithProviders(() => useStartRun(threadId))

    act(() => {
      result.current.mutate('Build a portfolio site')
    })

    await waitFor(() => {
      expect(result.current.data).toEqual({ run_id: startedRunId })
    })
    expect(requests).toEqual([
      {
        method: HttpMethod.Post,
        path: apiEndpoints.threadRuns.path({ threadId }),
        body: { input: 'Build a portfolio site' },
      },
    ])
  })

  itToastsOnResult([
    {
      name: 'a run that fails to start',
      start: () => {
        const { result } = renderHookWithProviders(() => useStartRun(threadId))
        act(() => {
          result.current.mutate('Build a portfolio site')
        })
      },
      refuse: () => {
        server.use(serverErrorOn(HttpMethod.Post, apiEndpoints.threadRuns.pattern))
      },
      kind: 'error',
      message: 'Failed to create the run (HTTP 500)',
    },
  ])
})
