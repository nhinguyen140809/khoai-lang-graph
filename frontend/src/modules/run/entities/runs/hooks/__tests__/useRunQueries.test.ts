import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { runIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useLatestRun, useRun, useRunCost, useThreadRuns } from '../useRunQueries'
import { runCostCases } from './useRunQueries.data'

describe('useThreadRuns', () => {
  it('loads the runs of a thread, the newest first', async () => {
    const { result } = renderHookWithProviders(() => useThreadRuns(threadIds.mentorMain))

    await waitForSuccess(result)
    const runs = pageItems(result.current.data)
    expect(runs.map(({ number }) => number)).toEqual([3, 2, 1])
  })
})

describe('useLatestRun', () => {
  it('loads the newest run of a thread', async () => {
    const { result } = renderHookWithProviders(() => useLatestRun(threadIds.mentorMain))

    await waitForSuccess(result)
    expect(result.current.data?.id).toBe(runIds.mentorMain3)
  })
})

describe('useRun', () => {
  it('loads one run', async () => {
    const { result } = renderHookWithProviders(() => useRun(runIds.mentorMain2))

    await waitForSuccess(result)
    expect(result.current.data).toMatchObject({ number: 2, status: 'failed' })
  })
})

describe('useRunCost', () => {
  it.each(runCostCases)('gives $name', async ({ runs, share }) => {
    server.use(
      http.get(apiEndpoints.threadRuns.pattern, () =>
        HttpResponse.json({ items: runs, next_cursor: null }),
      ),
    )

    const { result } = renderHookWithProviders(() => ({
      run: useLatestRun(threadIds.mentorMain),
      cost: useRunCost(threadIds.mentorMain),
    }))

    // The cost is read from the newest run, so it is final once that run has ended loading.
    await waitFor(() => {
      expect(result.current.run.isPending).toBe(false)
    })
    expect(result.current.cost).toEqual(share)
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useThreadRuns',
      useHook: () => useThreadRuns(threadIds.mentorMain, { isEnabled: false }),
    },
    {
      name: 'useLatestRun',
      useHook: () => useLatestRun(threadIds.mentorMain, { isEnabled: false }),
    },
    { name: 'useRun', useHook: () => useRun(runIds.mentorMain2, { isEnabled: false }) },
  ])
})
