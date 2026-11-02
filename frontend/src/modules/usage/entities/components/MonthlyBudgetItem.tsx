'use client'

import { GaugeIcon } from 'lucide-react'
import { useMemo } from 'react'

import { StatusBarSide, useStatusBarItem } from '@/shared/components/frame'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { Progress } from '@/shared/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { costLevelTones } from '@/shared/lib/cost'
import { formatCurrency, formatPercent } from '@/shared/lib/formatters'

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
 * bar and the percent, in the color of the level. The amounts show in a tooltip over the whole
 * item, which a screen reader reads as its description. A spent budget stops the work of every
 * project.
 */
export function MonthlyBudget() {
  const budget = useMonthlyBudget()
  if (budget === undefined || budget.level === 'normal') return null

  const tone = costLevelTones[budget.level]
  const percent = formatPercent(budget.percent / wholePercent)
  const amounts = usageMessages.spentOfBudget(
    formatCurrency(budget.costUsd),
    formatCurrency(budget.limitUsd),
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ColoredText
          color={tone}
          role="group"
          tabIndex={0}
          className="-mx-1.5 flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm transition-colors outline-none hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none [&_svg]:size-3.5"
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
        </ColoredText>
      </TooltipTrigger>
      <TooltipContent side="top">{amounts}</TooltipContent>
    </Tooltip>
  )
}
