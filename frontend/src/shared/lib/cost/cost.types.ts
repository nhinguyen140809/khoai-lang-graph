/** The levels that a cost reaches against its limit, from the lowest. */
export type CostLevel = 'normal' | 'warning' | 'danger'

/** A cost against its limit, both in USD: the percent of the limit it has reached, and its level. */
export interface CostShare {
  costUsd: number
  limitUsd: number
  percent: number
  level: CostLevel
}
