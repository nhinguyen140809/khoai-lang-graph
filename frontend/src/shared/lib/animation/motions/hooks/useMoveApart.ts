'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of two blocks that come together and move apart: how far the second goes down and to the right, and how far the first goes up and to the left (a negative number). */
export function useMoveApart(progress: MotionValue<number>) {
  const apart = useTransform(progress, (value) => 2.5 * Math.sin(value * Math.PI) ** 2)
  return { apart, away: useTransform(apart, (value) => -value) }
}
