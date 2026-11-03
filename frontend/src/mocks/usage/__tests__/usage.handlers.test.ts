import { describe, expect, it } from 'vitest'

import type { MonthlyUsage } from '@/modules/usage/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { getApi, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { rejectedCases } from './usage.handlers.data'

const path = apiEndpoints.usage.path()

describe('GET /me/usage', () => {
  it('answers the month of the mock data without groups', async () => {
    const usage = await getApi<MonthlyUsage>(path)

    expect(usage).toMatchObject({ month: '2026-10', budget_usd: 20, groups: [] })
    expect(usage.total.cost_usd).toBeCloseTo(4.755, 6)
  })

  it('groups by day, in the order of the days', async () => {
    const { groups } = await getApi<MonthlyUsage>(`${path}?group_by=day`)

    expect(groups).toHaveLength(7)
    const keys = groups.map(({ key }) => key)
    expect(keys).toEqual(keys.toSorted())
  })

  it('answers zeros and no groups for a month without usage', async () => {
    const usage = await getApi<MonthlyUsage>(`${path}?month=2026-11&group_by=model`)

    expect(usage.total.cost_usd).toBe(0)
    expect(usage.groups).toEqual([])
  })

  it('answers zeros and the budget in the empty scenario', async () => {
    openPage('/?mock-usage=empty')

    const usage = await getApi<MonthlyUsage>(path)

    expect(usage.total.cost_usd).toBe(0)
    expect(usage.budget_usd).toBe(20)
  })

  it.each([
    { scenario: 'warning', budget: 5.52 },
    { scenario: 'danger', budget: 5 },
    { scenario: 'none', budget: null },
  ])('answers the budget $budget in the $scenario scenario', async ({ scenario, budget }) => {
    openPage(`/?mock-budget=${scenario}`)

    expect((await getApi<MonthlyUsage>(path)).budget_usd).toBe(budget)
  })

  itRejectsRequests(rejectedCases)
})
