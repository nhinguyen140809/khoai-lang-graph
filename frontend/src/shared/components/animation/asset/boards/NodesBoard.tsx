'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of two nodes joined: a dot at each end of the board, low at the left and high at the right, and the line that runs from one to the other, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    dot: { at: [0.278, 0.278], radius: 0.148 },
    face: 'a',
    move: { light: { from: 0, to: 0.3 } },
  },
  {
    dot: { at: [0.722, 0.722], radius: 0.148 },
    face: 'a',
    move: { light: { from: 0.5, to: 0.9 } },
  },
  {
    line: {
      points: [
        [0.383, 0.383],
        [0.617, 0.617],
      ],
      width: 0.055,
    },
    face: 'b',
    move: { reveal: { from: 0.15, to: 0.6 } },
  },
]

/**
 * A board drawn as an asset that carries two nodes joined: two dots on a translucent panel, one
 * low at the left and one high at the right, with a line drawn in from one to the other, the dots
 * lighting up as it reaches them, as things are joined across. What stands behind the panel is
 * seen through it, whichever way it is seen from.
 */
export const NodesBoard = boardAssetOf('panel', marks)
