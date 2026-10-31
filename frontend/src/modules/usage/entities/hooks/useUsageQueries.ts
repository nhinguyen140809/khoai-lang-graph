import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { getMonthlyUsage } from '../usage.api'
import { usageKeys } from '../usage.keys'
import type { MonthlyUsageParams } from '../usage.types'

/**
 * The usage of the user in a month, the current one by default, with the budget of the month. It
 * changes while the runs of the user work, so a screen that shows it loads `usageKeys.all()` again
 * when a run changes its cost.
 */
export function useMonthlyUsage(
  params: MonthlyUsageParams = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: usageKeys.month(params),
    queryFn: () => getMonthlyUsage(params),
    enabled: isEnabled,
  })
}
