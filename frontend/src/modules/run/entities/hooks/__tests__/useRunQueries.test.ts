import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { allRuns } from '@/mocks/runs/runs.handlers'
import { IdPrefix, mockId, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { useLatestRun, useRunCost } from '../useRunQueries'
import { runCostCases } from './useRunQueries.data'

function renderRunCost(threadId: string) {
  return renderHook(() => ({ run: useLatestRun(threadId), cost: useRunCost(threadId) }), {
    wrapper: TestProviders,
  })
}

describe('useRunCost', () => {
  it.each(runCostCases)('gives the cost of $name', async ({ costUsd, cost }) => {
    // The latest run of the thread of the mock data, with the cost of the case.
    server.use(
      http.get('/api/v1/threads/:threadId/runs', ({ params }) => {
        const [latest] = allRuns()
          .filter((run) => run.thread_id === String(params.threadId))
          .toSorted((a, b) => b.number - a.number)
        const run = latest && { ...latest, usage: { ...latest.usage, cost_usd: costUsd } }
        return HttpResponse.json({ items: run ? [run] : [], next_cursor: null })
      }),
    )
    const { result } = renderRunCost(THREAD_IDS.libraryMain)

    await waitFor(() => {
      expect(result.current.run.isSuccess).toBe(true)
    })
    expect(result.current.cost).toEqual(cost)
  })

  it('gives nothing for a thread without a run', async () => {
    const { result } = renderRunCost(mockId(IdPrefix.Thread, 12))

    await waitFor(() => {
      expect(result.current.run.isSuccess).toBe(true)
    })
    expect(result.current.cost).toBeUndefined()
  })
})
