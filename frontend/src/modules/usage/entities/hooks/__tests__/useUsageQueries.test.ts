import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useMonthlyUsage } from '../useUsageQueries'

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

  itWaitsUntilEnabled([
    { name: 'useMonthlyUsage', useHook: () => useMonthlyUsage({}, { isEnabled: false }) },
  ])
})
