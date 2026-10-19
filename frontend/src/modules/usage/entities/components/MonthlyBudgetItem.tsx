'use client'

import { useMemo } from 'react'

import { StatusBarSide, useStatusBarItem } from '@/shared/components/frame'
import { CostMeter } from '@/shared/components/status'

import { useMonthlyBudget } from '../hooks/useMonthlyBudget'
import { usageMessages } from '../usage.constants'

/** Shows the budget of the month at the left of the status bar, after the status of the screen. */
export function MonthlyBudgetItem() {
  const content = useMemo(() => <MonthlyBudget />, [])

  useStatusBarItem({ side: StatusBarSide.Left, order: 1, content })

  return null
}

// TODO: open the usage of the month in the settings, once the settings show it.
/**
 * The share of the budget of the month that the user has spent, once it is above the normal level:
 * the budget stops the work of every project when it is spent.
 */
export function MonthlyBudget() {
  const budget = useMonthlyBudget()

  if (budget === undefined || budget.level === 'normal') return null
  return (
    <CostMeter percent={budget.percent} level={budget.level} label={usageMessages.monthlyBudget} />
  )
}
