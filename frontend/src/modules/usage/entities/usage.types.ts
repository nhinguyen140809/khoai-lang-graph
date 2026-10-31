import { z } from 'zod'

// Temporary hand-written schemas for the usage API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** What the usage of a month is grouped by: the day, the project, the agent role or the model. */
export const usageGroupings = ['day', 'project', 'agent_role', 'model'] as const
export type UsageGrouping = (typeof usageGroupings)[number]

/** The tokens, cost and time that the steps of the user used. */
export const usageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_tokens: z.number().int(),
  cache_write_tokens: z.number().int(),
  cost_usd: z.number(),
  duration_ms: z.number().int(),
})
export type Usage = z.infer<typeof usageSchema>

/** The usage of one day, project, agent role or model of the month. */
export const usageGroupSchema = z.object({
  /** The id of the project, the day (`YYYY-MM-DD`), the agent role or the model. */
  key: z.string(),
  usage: usageSchema,
})
export type UsageGroup = z.infer<typeof usageGroupSchema>

/** The usage of the user in one calendar month in UTC, with the budget that applies to it. */
export const monthlyUsageSchema = z.object({
  /** `YYYY-MM`. */
  month: z.string(),
  /** In USD: the budget of the user, or the default of the server; null when the month has no limit. */
  budget_usd: z.number().nullable(),
  total: usageSchema,
  /** Empty unless the usage is grouped; one entry for each key with usage. */
  groups: z.array(usageGroupSchema),
})
export type MonthlyUsage = z.infer<typeof monthlyUsageSchema>

/** Which month to read, the current one when left out, and what to group it by, nothing when left out. */
export interface MonthlyUsageParams {
  /** `YYYY-MM`, in UTC. */
  month?: string | undefined
  groupBy?: UsageGrouping | undefined
}
