import type { Tone } from '@/shared/lib/tone'

import type { LinkQuote } from '../chains/chains.types'

/**
 * The color of a mark of quoted words, by the direction of its link: the words a record quotes
 * of another in primary, the words of it that another quotes in the yellow of the charts.
 */
export const quoteMarkColors = {
  source: 'primary',
  target: 'chart',
} as const satisfies Record<LinkQuote['side'], Tone>
