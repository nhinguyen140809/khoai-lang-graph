'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The lengths of the three lines that repeat, in shares of the width of the board. */
const lengths = [0.74, 0.463, 0.601] as const

/** How many lines there are in all, which fill the height while the lines slide up by one repeat of three. */
const lineCount = 8

/** How far up the board the top of the first line runs, and how far apart the lines are, in shares of its height. */
const start = 0.764
const apart = 0.176

/** How the lines drift up the board: how far over the round, and between which edges of it they are seen. */
const drifting = {
  by: 0.529,
  within: { bottom: 0.13, top: 0.87, fade: 0.106 },
} as const

/** How thick a line of words runs, in shares of the height of the board. */
const thickness = 0.055

/** The way a line of words is laid on the board: from the left edge, in the middle, or to the right edge. */
type Align = 'left' | 'center' | 'right'

/** Where a line of the given length starts across the board, laid the way it is to be read. */
function startOf(align: Align, length: number): number {
  if (align === 'left') return 0.13
  if (align === 'center') return 0.5 - length / 2
  return 0.87 - length
}

/** The marks of a page of words, laid the way they are to be read and drifting up the board without end, the spare lines below the last for the drifting to come round seamless. */
function marksOf(align: Align): readonly BoardMark[] {
  return Array.from({ length: lineCount }, (_, index) => {
    const length = lengths[index % lengths.length] ?? 0
    const from = startOf(align, length)
    const up = start - index * apart
    return {
      rect: {
        from: [from, up],
        to: [from + length, up + thickness],
      },
      face: 'a',
      move: { cycle: drifting },
    }
  })
}

/**
 * Boards drawn as assets that carry pages of words: lines of them over a translucent panel, each
 * starting at the left edge, set in the middle, or ending at the right edge, drifting up the
 * board without end as a text is read, the spare lines below the last so the round comes round
 * without a seam. What stands behind the panel is seen through it, whichever way it is seen from.
 */
export const TextLeftBoard = boardAssetOf('panel', marksOf('left'))
export const TextCenterBoard = boardAssetOf('panel', marksOf('center'))
export const TextRightBoard = boardAssetOf('panel', marksOf('right'))
