'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** How the rows drift up the board: how far over the round, and between which edges of it they are seen. */
const drifting = {
  by: 0.592,
  within: { bottom: 0.03, top: 0.89, fade: 0.11 },
} as const

/** The marks of a list of events: a row for each, a line of words at the left for what happens and a solid block at the right for when, the rows below the last for the drifting to come round seamless. */
const marks: readonly BoardMark[] = Array.from({ length: 6 }, (_, row): readonly BoardMark[] => {
  const line = 0.759 - row * 0.296
  const block = 0.759 - row * 0.296
  return [
    {
      rect: { from: [0.13, line], to: [0.459, line + 0.056] },
      face: 'a',
      move: { cycle: drifting },
    },
    {
      rect: { from: [0.623, block - 0.111], to: [0.87, block + 0.111] },
      face: 'b',
      move: { cycle: drifting },
    },
  ]
}).flat()

/**
 * A board drawn as an asset that carries a list of events: rows on a translucent panel, a line of
 * words for what happens and a solid block for when, drifting up the board without end, the spare
 * rows below the last so the round comes round without a seam. What stands behind the panel is
 * seen through it, whichever way it is seen from.
 */
export const EventListBoard = boardAssetOf('panel', marks)
