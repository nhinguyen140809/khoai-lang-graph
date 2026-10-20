import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { useMonthlyBudget } from '../useMonthlyBudget'
import { monthlyBudgetCases } from './useMonthlyBudget.data'

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('useMonthlyBudget', () => {
  it.each(monthlyBudgetCases)('gives $name', async ({ address, share }) => {
    openPage(address)

    const { result } = renderHook(() => useMonthlyBudget(), { wrapper: TestProviders })

    await waitFor(() => {
      expect(result.current).toEqual(share)
    })
  })

  it('gives a budget at its normal level for the usage of the mock data', async () => {
    const { result } = renderHook(() => useMonthlyBudget(), { wrapper: TestProviders })

    await waitFor(() => {
      expect(result.current?.level).toBe('normal')
    })
  })
})
