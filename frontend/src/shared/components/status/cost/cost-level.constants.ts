import type { CostLevel } from '@/shared/lib/cost'
import type { Tone } from '@/shared/lib/tone'

/** The color of each level of a cost: the primary color, then amber, then red. */
export const costLevelTones = {
  normal: 'primary',
  warning: 'warning',
  danger: 'destructive',
} as const satisfies Record<CostLevel, Tone>
