'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of a bar that slides to and fro across, as far as `reach` to each side, in its own time (`phase` is where along the round it is at the right): how far it is to the right of where it rests. */
export function useSlideToAndFro(progress: MotionValue<number>, reach: number, phase: number) {
  return useTransform(progress, (value) => reach * Math.sin((value + phase) * Math.PI * 2))
}
