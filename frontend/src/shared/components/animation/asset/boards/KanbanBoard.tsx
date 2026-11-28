'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a plan in columns: three solid columns under a head each stays at, one taller than another, in shares of the board. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.14, 0.289], to: [0.33, 0.87] },
    face: 'a',
    move: { grow: { phase: 0, from: 'head' } },
  },
  {
    rect: { from: [0.405, 0.553], to: [0.595, 0.87] },
    face: 'a',
    move: { grow: { phase: 0.33, from: 'head' } },
  },
  {
    rect: { from: [0.67, 0.13], to: [0.86, 0.87] },
    face: 'a',
    move: { grow: { phase: 0.66, from: 'head' } },
  },
]

/**
 * A board drawn as an asset that carries a plan in columns, the way the kanban icon of the same
 * name draws it: three solid columns, each growing and shortening in its own time from the head
 * that stays, as cards move between them. What stands behind the panel is seen through it,
 * whichever way it is seen from.
 */
export const KanbanBoard = boardAssetOf('panel', marks)
