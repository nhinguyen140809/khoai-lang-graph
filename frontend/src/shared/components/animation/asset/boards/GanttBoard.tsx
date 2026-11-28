'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a chart of tasks along a time: three bars in rows of their own, starting when its task starts and lasting as long as it runs, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.241, 0.722], to: [0.537, 0.87] },
    face: 'b',
    move: { slide: { reach: 0.09, phase: 0 } },
  },
  {
    rect: { from: [0.389, 0.426], to: [0.722, 0.574] },
    face: 'b',
    move: { slide: { reach: 0.09, phase: 0.33 } },
  },
  {
    rect: { from: [0.278, 0.13], to: [0.537, 0.278] },
    face: 'b',
    move: { slide: { reach: 0.09, phase: 0.66 } },
  },
]

/**
 * A board drawn as an asset that carries a plan along a time: three bars in rows of their own on
 * a translucent panel, each sliding to and fro in its own time, as the plan is moved about. What
 * stands behind the panel is seen through it, whichever way it is seen from.
 */
export const GanttBoard = boardAssetOf('panel', marks)
