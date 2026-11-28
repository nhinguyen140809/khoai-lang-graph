'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of nodes that fork: one dot at the left of the board, two at the right above and below it, and a line from the first to each of the others, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    dot: { at: [0.236, 0.5], radius: 0.106 },
    face: 'a',
    move: { appear: { from: 0, to: 0.1 } },
  },
  {
    dot: { at: [0.764, 0.764], radius: 0.106 },
    face: 'a',
    move: { light: { from: 0.4, to: 0.5 } },
  },
  {
    dot: { at: [0.764, 0.236], radius: 0.106 },
    face: 'a',
    move: { light: { from: 0.6, to: 0.7 } },
  },
  {
    line: {
      points: [
        [0.326, 0.55],
        [0.689, 0.714],
      ],
      width: 0.056,
    },
    face: 'b',
    move: { reveal: { from: 0.15, to: 0.45 } },
  },
  {
    line: {
      points: [
        [0.326, 0.45],
        [0.689, 0.286],
      ],
      width: 0.056,
    },
    face: 'b',
    move: { reveal: { from: 0.35, to: 0.65 } },
  },
]

/**
 * A board drawn as an asset that carries nodes that fork: a dot at the left of a translucent
 * panel, two at the right above and below it, with a line drawn in from the first to each of the
 * others and the dots lighting up as they are reached, as one thing leads to two. What stands
 * behind the panel is seen through it, whichever way it is seen from.
 */
export const ForkNodesBoard = boardAssetOf('panel', marks)
