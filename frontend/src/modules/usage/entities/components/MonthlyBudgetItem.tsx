'use client'

import { cn } from 'cn'
import { GaugeIcon } from 'lucide-react'
import { useMemo } from 'react'

import { StatusBarSide, useStatusBarItem } from '@/shared/components/frame'
import { Progress } from '@/shared/components/ui/progress'
import { costLevelTones } from '@/shared/lib/cost'
import { formatCurrency, formatPercent } from '@/shared/lib/formatters'
import { toneClasses } from '@/shared/lib/tone'

import { useMonthlyBudget } from '../hooks/useUsageQueries'
import { usageMessages } from '../usage.constants'

/** Shows the budget of the month at the left of the status bar, after the status of the screen. */
export function MonthlyBudgetItem() {
  const content = useMemo(() => <MonthlyBudget />, [])
  useStatusBarItem({ side: StatusBarSide.Left, order: 1, content })
  return null
}

/**
 * One hundred percent, the whole budget: the bar is full there, also for a budget over its limit,
 * and a percent divided by it is the ratio that `formatPercent` writes.
 */
const wholePercent = 100

// TODO: open the usage of the month in the settings, once the settings show it.
/**
 * The budget of the month that the user has spent, once it is above the normal level: a gauge, a
 * bar, the percent and the amounts, in the color of the level. A spent budget stops the work of
 * every project.
 */
export function MonthlyBudget() {
  const budget = useMonthlyBudget()
  if (budget === undefined || budget.level === 'normal') return null

  const tone = costLevelTones[budget.level]
  const percent = formatPercent(budget.percent / wholePercent)
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 text-sm text-(--tone-strong) [&_svg]:size-3.5',
        toneClasses[tone],
      )}
    >
      <GaugeIcon aria-hidden />
      {/* A cost over its limit fills the bar. The bar says the percent to assistive technology. */}
      <Progress
        value={Math.min(budget.percent, wholePercent)}
        color={tone}
        aria-label={usageMessages.monthlyBudget}
        getValueLabel={() => percent}
        className="h-2 w-16 bg-foreground/10"
      />
      <span aria-hidden className="tabular-nums">
        {percent}
      </span>
      <span className="tabular-nums">
        {usageMessages.spentOfBudget(
          formatCurrency(budget.costUsd),
          formatCurrency(budget.limitUsd),
        )}
      </span>
    </span>
  )
}
