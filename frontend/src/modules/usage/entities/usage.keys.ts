import type { MonthlyUsageParams } from './usage.types'

/** The query keys of the usage of the user, from the widest to the narrowest; each starts with the one above. */
export const usageKeys = {
  all: () => ['usage'] as const,
  /** The usage of one month, grouped or not. */
  month: (params: MonthlyUsageParams) => [...usageKeys.all(), 'month', params] as const,
}
