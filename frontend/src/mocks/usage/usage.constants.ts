/** The month that the usage reads without `?month=`: the month of the fixtures. */
export const mockUsageMonth = '2026-10'

/** The monthly budget in USD that the server gives a user without one of their own. */
export const serverBudgetUsd = 20

/** With `?mock-budget=warning` or `danger`, the share of its budget that the month has spent. */
export const budgetShares = { warning: 0.86, danger: 0.95 } as const

/** The costs are rounded to this many steps per dollar (the millionth), to drop the error of float sums. */
export const costStepsPerDollar = 1_000_000

/** The budget is rounded down to the cent: this many cents make a dollar. */
export const centsPerDollar = 100

/** The length of a day in an ISO time, `YYYY-MM-DD`. */
export const isoDayLength = 10
