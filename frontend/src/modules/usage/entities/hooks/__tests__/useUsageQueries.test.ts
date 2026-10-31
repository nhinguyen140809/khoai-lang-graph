import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { costQueryMeta } from '@/shared/api/query-client'
import { openPage } from '@/test/msw'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { usageKeys } from '../../usage.keys'
import { useMonthlyBudget, useMonthlyUsage } from '../useUsageQueries'
import { monthlyBudgetCases } from './useUsageQueries.data'

describe('useMonthlyUsage', () => {
  it('loads the month of the mock data', async () => {
    const { result } = renderHookWithProviders(() => useMonthlyUsage())

    await waitForSuccess(result)
    expect(result.current.data?.month).toBe('2026-10')
  })

  it('loads the groups that it asks for', async () => {
    const { result } = renderHookWithProviders(() => useMonthlyUsage({ groupBy: 'model' }))

    await waitForSuccess(result)
    expect(result.current.data?.groups).toHaveLength(2)
  })

  it('marks its query as one that holds a cost', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHookWithProviders(() => useMonthlyUsage(), { queryClient })

    await waitForSuccess(result)
    const query = queryClient.getQueryCache().find({ queryKey: usageKeys.month({}) })
    expect(query?.meta).toEqual(costQueryMeta)
  })

  itWaitsUntilEnabled([
    { name: 'useMonthlyUsage', useHook: () => useMonthlyUsage({}, { isEnabled: false }) },
  ])
})

describe('useMonthlyBudget', () => {
  it.each(monthlyBudgetCases)('gives $name', async ({ address, share }) => {
    openPage(address)

    const { result } = renderHookWithProviders(() => ({
      usage: useMonthlyUsage(),
      budget: useMonthlyBudget(),
    }))

    // The budget is read from the usage, so it is final once the usage has ended.
    await waitFor(() => {
      expect(result.current.usage.isPending).toBe(false)
    })
    if (share === undefined) expect(result.current.budget).toBeUndefined()
    else expect(result.current.budget).toMatchObject(share)
  })
})
