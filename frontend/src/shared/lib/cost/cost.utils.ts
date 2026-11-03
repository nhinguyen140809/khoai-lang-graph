import { costLevelPercents } from './cost.constants'
import type { CostLevel, CostShare } from './cost.types'

/**
 * The percent of its limit that a cost has reached, both in USD, in whole percents rounded down,
 * so that the percent on screen reaches a level only when the cost does. Undefined without a limit.
 */
export function costPercent(costUsd: number, limitUsd: number | null): number | undefined {
  if (limitUsd === null) return undefined
  // In whole cents, as the amounts show.
  const cost = Math.round(costUsd * 100)
  const limit = Math.round(limitUsd * 100)
  if (limit <= 0) return undefined
  return Math.floor((cost * 100) / limit)
}

/** The level that a percent of its limit puts a cost at: the highest level whose percent it reaches. */
export function costLevel(percent: number): CostLevel {
  if (percent >= costLevelPercents.danger) return 'danger'
  if (percent >= costLevelPercents.warning) return 'warning'
  return 'normal'
}

/** A cost against its limit, both in USD. Undefined without a limit, or for a limit of nothing. */
export function costShare(costUsd: number, limitUsd: number | null): CostShare | undefined {
  const percent = costPercent(costUsd, limitUsd)
  if (percent === undefined || limitUsd === null) return undefined
  return { costUsd, limitUsd, percent, level: costLevel(percent) }
}
