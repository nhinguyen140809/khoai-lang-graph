import { useQuery } from '@tanstack/react-query'

import { costQueryMeta, type HookQueryOptions } from '@/shared/api/query-client'
import { type CostShare, costShare } from '@/shared/lib/cost'

import { getMonthlyUsage } from '../usage.api'
import { usageKeys } from '../usage.keys'
import type { MonthlyUsageParams } from '../usage.types'

/**
 * The usage of the user in a month, the current one by default, with the budget of the month. It
 * loads again when a run of the user changes its cost.
 */
export function useMonthlyUsage(
  params: MonthlyUsageParams = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: usageKeys.month(params),
    queryFn: () => getMonthlyUsage(params),
    meta: costQueryMeta,
    enabled: isEnabled,
  })
}

/**
 * The budget of the month that the user has spent. Undefined while the usage loads, when it fails
 * to load, and for a month without a budget.
 */
export function useMonthlyBudget(): CostShare | undefined {
  const usage = useMonthlyUsage()
  if (usage.data === undefined) return undefined
  return costShare(usage.data.total.cost_usd, usage.data.budget_usd)
}
