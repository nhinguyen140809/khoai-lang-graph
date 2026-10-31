import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { type MonthlyUsage, type MonthlyUsageParams, monthlyUsageSchema } from './usage.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The usage of the user in a month, with the budget of the month and, when asked, its groups. */
export function getMonthlyUsage({
  month,
  groupBy,
}: MonthlyUsageParams = {}): Promise<MonthlyUsage> {
  return apiRequest(
    pathWithQuery(apiEndpoints.usage.path(), { month, group_by: groupBy }),
    monthlyUsageSchema,
    { action: 'load your usage' },
  )
}
