'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of a bar that rises and falls in its own time (`phase` is where along the round it is highest): how tall it is, as a share of its full height. */
export function useRiseAndFall(progress: MotionValue<number>, phase: number) {
  return useTransform(
    progress,
    (value) => 0.55 + 0.45 * Math.abs(Math.sin((value + phase) * Math.PI * 2)),
  )
}
