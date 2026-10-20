import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { MonthlyBudget } from '../MonthlyBudgetItem'
import { monthlyBudgetShownCases } from './MonthlyBudgetItem.data'

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('MonthlyBudget', () => {
  it.each(monthlyBudgetShownCases)('shows $name', async ({ address, shown }) => {
    openPage(address)

    render(<MonthlyBudget />, { wrapper: TestProviders })

    // The usage loads after the first render, which shows nothing.
    await waitFor(() => {
      expect(
        screen
          .queryByRole('progressbar', { name: 'Monthly budget used' })
          ?.getAttribute('aria-valuetext') ?? null,
      ).toBe(shown)
    })
  })
})
