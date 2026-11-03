import type { CostLevel, CostShare } from '../cost.types'

/** A percent of its limit that a cost has reached, and the level it puts the cost at. */
export const costLevelCases: { percent: number; level: CostLevel }[] = [
  { percent: 0, level: 'normal' },
  { percent: 79, level: 'normal' },
  { percent: 80, level: 'warning' },
  { percent: 89, level: 'warning' },
  { percent: 90, level: 'danger' },
  { percent: 105, level: 'danger' },
]

/** A cost and its limit in USD, and the percent of the limit that the cost has reached. */
export const costPercentCases: {
  name: string
  costUsd: number
  limitUsd: number | null
  percent: number | undefined
}[] = [
  { name: 'a whole percent', costUsd: 1.72, limitUsd: 2, percent: 86 },
  { name: 'a percent rounded down', costUsd: 1.79, limitUsd: 2, percent: 89 },
  { name: 'a percent of the amounts as they show', costUsd: 1.796, limitUsd: 2, percent: 90 },
  { name: 'a percent that floating point misses', costUsd: 0.24, limitUsd: 0.3, percent: 80 },
  { name: 'a cost over its limit', costUsd: 2.1, limitUsd: 2, percent: 105 },
  { name: 'nothing without a limit', costUsd: 9, limitUsd: null, percent: undefined },
  { name: 'nothing for a limit of nothing', costUsd: 0, limitUsd: 0, percent: undefined },
]

/** A cost and its limit in USD, and the share of the limit that the cost has reached. */
export const costShareCases: {
  name: string
  costUsd: number
  limitUsd: number | null
  share: CostShare | undefined
}[] = [
  {
    name: 'a share near its limit',
    costUsd: 1.72,
    limitUsd: 2,
    share: { costUsd: 1.72, limitUsd: 2, percent: 86, level: 'warning' },
  },
  {
    name: 'a share at the normal level',
    costUsd: 0.5,
    limitUsd: 2,
    share: { costUsd: 0.5, limitUsd: 2, percent: 25, level: 'normal' },
  },
  { name: 'nothing without a limit', costUsd: 9, limitUsd: null, share: undefined },
  { name: 'nothing for a limit of nothing', costUsd: 0, limitUsd: 0, share: undefined },
]
