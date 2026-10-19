import { http, HttpResponse } from 'msw'

import { allRuns } from '../runs/runs.handlers'
import { mockRecord } from '../shared/mock-db.utils'
import { answerScenario, pageParam } from '../shared/mock-scenario.utils'
import { notFound } from '../shared/problem.utils'
import { mockMe } from './me.fixtures'

/** The signed-in user; registering an account replaces it. */
export const meRecord = mockRecord('me', () => mockMe)

// The month of the mock data, which the usage reads without `?month=`, and the budget of the
// server for a user without one of their own.
const MOCK_MONTH = '2026-10'
const DEFAULT_BUDGET_USD = 20

// With `?mock-budget=warning` or `danger`, the month has spent this share of its budget.
const spentShares: Record<string, number> = { warning: 0.86, danger: 0.95 }

// The cost of the runs that started in a month, to the cent.
function costOfMonth(month: string): number {
  const cost = allRuns()
    .filter(({ started_at: startedAt }) => startedAt?.startsWith(month) === true)
    .reduce((sum, run) => sum + run.usage.cost_usd, 0)
  return Math.round(cost * 100) / 100
}

export const meHandlers = [
  http.get('/api/v1/me', async () => {
    const scenario = await answerScenario('me')
    return scenario === 'empty' ? notFound('The user') : HttpResponse.json(meRecord.get())
  }),

  // The total of the month only: the mock answers no groups, which the app does not read.
  http.get('/api/v1/me/usage', async ({ request }) => {
    await answerScenario('usage')
    const month = new URL(request.url).searchParams.get('month') ?? MOCK_MONTH
    const budget = meRecord.get().monthly_budget_usd ?? DEFAULT_BUDGET_USD
    const share = spentShares[pageParam('mock-budget') ?? '']
    const cost = share === undefined ? costOfMonth(month) : Math.round(budget * share * 100) / 100
    return HttpResponse.json({
      month,
      budget_usd: budget,
      total: {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_tokens: 0,
        cache_write_tokens: 0,
        cost_usd: cost,
        duration_ms: 0,
      },
      groups: [],
    })
  }),
]
