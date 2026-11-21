'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of a mark that blinks `blinks` times when its turn comes, over the stretch from `from` to `to` of the round, and is lit the rest of the time: how bright it is. */
export function useBlinkInTurn(
  progress: MotionValue<number>,
  from: number,
  to: number,
  blinks: number,
) {
  return useTransform(progress, (value) => {
    if (value < from || value >= to) return 1
    const turn = (value - from) / (to - from)
    return Math.floor(turn * blinks * 2) % 2 === 0 ? 0.15 : 1
  })
}
