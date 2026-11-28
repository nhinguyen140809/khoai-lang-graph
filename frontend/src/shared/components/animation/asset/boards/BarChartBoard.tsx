'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a chart of bars: three solid columns from the foot of the board, each as tall as the figure it weighs, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.13, 0.13], to: [0.286, 0.525] },
    face: 'b',
    move: { grow: { phase: 0, from: 'foot' } },
  },
  {
    rect: { from: [0.398, 0.13], to: [0.554, 0.87] },
    face: 'a',
    move: { grow: { phase: 0.33, from: 'foot' } },
  },
  {
    rect: { from: [0.666, 0.13], to: [0.821, 0.673] },
    face: 'b',
    move: { grow: { phase: 0.66, from: 'foot' } },
  },
]

/**
 * A board drawn as an asset that carries a chart of bars: three solid columns from the foot of a
 * translucent panel, rising and falling each in its own time, as figures are weighed. What stands
 * behind the panel is seen through it, whichever way it is seen from.
 */
export const BarChartBoard = boardAssetOf('panel', marks)
