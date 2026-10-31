import type { Tone } from '@/shared/lib/tone'

import type { CostLevel } from './cost.types'

/** The percent of its limit from which a cost is at each level. */
export const costLevelPercents = {
  normal: 0,
  warning: 80,
  danger: 90,
} as const satisfies Record<CostLevel, number>

/** The color of each level of a cost: the primary color, then amber, then red. */
export const costLevelTones = {
  normal: 'primary',
  warning: 'warning',
  danger: 'destructive',
} as const satisfies Record<CostLevel, Tone>
