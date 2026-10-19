/** The levels that a cost reaches against its limit, from the lowest. */
export type CostLevel = 'normal' | 'warning' | 'danger'

/** What a cost shows against its limit: the percent of the limit that it has reached, and its level. */
export interface CostShare {
  percent: number
  level: CostLevel
}
