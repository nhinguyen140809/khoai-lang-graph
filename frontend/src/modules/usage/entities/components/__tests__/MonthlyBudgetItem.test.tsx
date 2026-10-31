import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { openPage } from '@/test/msw'
import { renderWorkbench } from '@/test/render'
import { expectNoAccessibilityViolations, statusBar } from '@/test/steps'

import { MonthlyBudgetItem } from '../MonthlyBudgetItem'
import { monthlyBudgetShownCases } from './MonthlyBudgetItem.data'

const barName = 'Monthly budget used'

describe('MonthlyBudgetItem', () => {
  it.each(monthlyBudgetShownCases)('shows $name', async ({ address, shown }) => {
    openPage(address)

    renderWorkbench(<MonthlyBudgetItem />)

    if (shown === null) {
      // The usage loads after the first render, which shows nothing either.
      await screen.findByRole('contentinfo')
      await waitFor(() => {
        expect(within(statusBar()).queryByRole('progressbar')).toBeNull()
      })
      return
    }
    const bar = await within(statusBar()).findByRole('progressbar', { name: barName })
    expect(bar).toHaveAttribute('aria-valuetext', shown.percent)
    expect(bar).toHaveAttribute('aria-valuenow', shown.percent.replace('%', ''))
    expect(within(statusBar()).getByText(shown.amounts)).toBeInTheDocument()
  })

  it('leaves the status bar with the component', async () => {
    openPage('/?mock-budget=warning')
    const { rerenderContributions } = renderWorkbench(<MonthlyBudgetItem />)
    await within(statusBar()).findByRole('progressbar', { name: barName })

    rerenderContributions(null)

    await waitFor(() => {
      expect(within(statusBar()).queryByRole('progressbar')).toBeNull()
    })
  })

  it('has no accessibility violations', async () => {
    openPage('/?mock-budget=warning')
    const { container } = renderWorkbench(<MonthlyBudgetItem />)
    await within(statusBar()).findByRole('progressbar', { name: barName })

    await expectNoAccessibilityViolations(container)
  })
})
