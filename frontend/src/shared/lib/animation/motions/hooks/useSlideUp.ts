'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { seenWithin } from '../../animation.utils'

/**
 * The motion of rows that slide up without end: where the row `index` is, and how seen it is. The
 * rows are `gap` apart from `top` down, and slide up by `rowsPerRound` rows over the round, so that
 * the end of the round looks as its start does. A row is seen whole between `edges.top` and
 * `edges.bottom` and fades out `edges.fade` before them.
 */
export function useSlideUp(
  progress: MotionValue<number>,
  {
    index,
    top,
    gap,
    rowsPerRound,
    edges,
  }: {
    index: number
    top: number
    gap: number
    rowsPerRound: number
    edges: { top: number; bottom: number; fade: number }
  },
) {
  const y = useTransform(progress, (value) => top + gap * index - gap * rowsPerRound * value)
  const opacity = useTransform(y, (at) => seenWithin(at, edges))
  return { y, opacity }
}
