'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The line of the chart, through the points it runs: the curve of the chart-spline icon of the same name, told in shares of the board. */
const curve: readonly (readonly [number, number])[] = [
  [0.13, 0.13],
  [0.193, 0.192],
  [0.243, 0.338],
  [0.29, 0.514],
  [0.344, 0.66],
  [0.418, 0.722],
  [0.491, 0.664],
  [0.544, 0.527],
  [0.588, 0.362],
  [0.632, 0.225],
  [0.685, 0.167],
  [0.738, 0.233],
  [0.777, 0.393],
  [0.808, 0.591],
  [0.837, 0.768],
  [0.87, 0.87],
]

/** The marks of a chart of a line: the line itself, drawn in over the first part of the round, and the dot at its end, showing as it reaches it. */
const marks: readonly BoardMark[] = [
  {
    line: { points: curve, width: 0.08 },
    face: 'a',
    move: { reveal: { from: 0.05, to: 0.7 } },
  },
  {
    dot: { at: [0.822, 0.822], radius: 0.1 },
    face: 'b',
    move: { appear: { from: 0.65, to: 0.8 } },
  },
]

/**
 * A board drawn as an asset that carries a chart of a line: the line drawn in from its start to
 * its end over the first part of the round, with a dot showing at its end as it reaches it, the
 * curve of the chart of the same name. What stands behind the panel is seen through it,
 * whichever way it is seen from.
 */
export const LineChartBoard = boardAssetOf('panel', marks)
