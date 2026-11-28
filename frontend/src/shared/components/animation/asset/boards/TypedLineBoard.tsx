'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a typed line: the words of it as blocks of their own length, each showing over a stretch of the round, and the cursor that waits after them, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.13, 0.465], to: [0.271, 0.535] },
    face: 'a',
    move: { appear: { from: 0, to: 0.2 } },
  },
  {
    rect: { from: [0.341, 0.465], to: [0.518, 0.535] },
    face: 'a',
    move: { appear: { from: 0.2, to: 0.45 } },
  },
  {
    rect: { from: [0.588, 0.465], to: [0.694, 0.535] },
    face: 'a',
    move: { appear: { from: 0.45, to: 0.65 } },
  },
  {
    rect: { from: [0.764, 0.465], to: [0.87, 0.535] },
    face: 'a',
    move: { appear: { from: 0.65, to: 0.85 } },
  },
  {
    rect: { from: [0.165, 0.13], to: [0.218, 0.87] },
    face: 'b',
    move: { appear: { from: 0.85, to: 0.95 } },
  },
]

/**
 * A board drawn as an asset that carries a typed line: the words of it as blocks of their own
 * length, showing one after another over the round, with the cursor standing after them, as a
 * line is when it waits for more. What stands behind the panel is seen through it, whichever way
 * it is seen from.
 */
export const TypedLineBoard = boardAssetOf('panel', marks)
