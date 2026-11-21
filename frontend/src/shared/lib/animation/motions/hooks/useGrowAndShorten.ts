'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of a column that grows and shortens in its own time (`phase` is where along the round it is longest): how long it is, as a share of its full length. */
export function useGrowAndShorten(progress: MotionValue<number>, phase: number) {
  return useTransform(
    progress,
    (value) => 0.6 + 0.4 * Math.abs(Math.sin((value + phase) * Math.PI)),
  )
}
