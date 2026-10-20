import { apiRequest } from '@/shared/api/api-fetch.utils'

import { type MonthlyUsage, monthlyUsageSchema } from './usage.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The usage of the user in the current month, with the budget of the month. */
export function getMonthlyUsage(): Promise<MonthlyUsage> {
  return apiRequest('/api/v1/me/usage', monthlyUsageSchema, { action: 'load your usage' })
}
