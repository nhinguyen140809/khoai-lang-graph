import { z } from 'zod'

// Temporary hand-written schemas for the usage API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/**
 * The usage of the user in one calendar month, with the budget that applies to it. The app reads
 * the cost of the month only, so the tokens and the groups are left out.
 */
export const monthlyUsageSchema = z.object({
  /** The month, `YYYY-MM`, in UTC. */
  month: z.string(),
  /** The budget of the month in USD, the one of the user or the server default; null without one. */
  budget_usd: z.number().nullable(),
  total: z.object({ cost_usd: z.number() }),
})

export type MonthlyUsage = z.infer<typeof monthlyUsageSchema>
