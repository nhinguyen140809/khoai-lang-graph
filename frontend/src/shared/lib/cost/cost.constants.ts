import type { CostLevel } from './cost.types'

/** The percent of its limit from which a cost is at each level. */
export const costLevelPercents = {
  normal: 0,
  warning: 80,
  danger: 90,
} as const satisfies Record<CostLevel, number>
