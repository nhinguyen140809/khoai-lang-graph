'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of the cursor of a line that is typed: it blinks `blinks` times over the round, and goes along `travel` while the line is typed, in the first 85% of the round. How seen it is, and how far along it is. */
export function useTypeWithCursor(
  progress: MotionValue<number>,
  { blinks, travel }: { blinks: number; travel: number },
) {
  return {
    opacity: useTransform(progress, (value) => (Math.floor(value * blinks * 2) % 2 === 0 ? 1 : 0)),
    x: useTransform(progress, (value) => stretchOf(value, 0, 0.85) * travel),
  }
}
