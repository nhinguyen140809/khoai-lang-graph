'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a group taken apart: two solid blocks standing apart from one another, one up and to the left, the other down and to the right, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.13, 0.56], to: [0.48, 0.87] },
    face: 'b',
    move: { slide: { reach: 0.07, phase: 0 } },
  },
  {
    rect: { from: [0.52, 0.13], to: [0.87, 0.44] },
    face: 'b',
    move: { slide: { reach: 0.07, phase: 0.5 } },
  },
]

/**
 * A board drawn as an asset that carries a group taken apart: two solid blocks on a translucent
 * panel, standing apart with a gap between them, sliding away from one another and coming back,
 * half a round apart, as a group is when it comes undone. What stands behind the panel is seen
 * through it, whichever way it is seen from.
 */
export const UngroupBoard = boardAssetOf('panel', marks)
