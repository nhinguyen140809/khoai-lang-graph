import { useQuery } from '@tanstack/react-query'

import { costQueryMeta } from '@/shared/api/query-meta.utils'
import { costLevel, costPercent, type CostShare } from '@/shared/lib/cost'

import { getMonthlyUsage } from '../usage.api'
import { usageKeys } from '../usage.keys'

/**
 * The share of the budget of the month that the user has spent. Undefined while the usage loads,
 * when it fails to load, and for a month without a budget. The usage loads again when a run of the
 * user changes its cost.
 */
export function useMonthlyBudget(): CostShare | undefined {
  const usage = useQuery({
    queryKey: usageKeys.month(),
    queryFn: getMonthlyUsage,
    meta: costQueryMeta,
  })

  if (usage.data === undefined) return undefined
  const percent = costPercent(usage.data.total.cost_usd, usage.data.budget_usd)
  return percent === undefined ? undefined : { percent, level: costLevel(percent) }
}
