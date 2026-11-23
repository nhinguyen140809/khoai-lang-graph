'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of a pen that writes: its point goes across to and fro (`strokes` times, as far as `reach` to each side) and its other end leans behind it, by up to `lean` degrees, turning about the point as the point changes its way. */
export function useWriteAcross(
  progress: MotionValue<number>,
  { strokes, reach, lean }: { strokes: number; reach: number; lean: number },
) {
  return {
    x: useTransform(progress, (value) => Math.sin(value * Math.PI * 2 * strokes) * reach),
    rotate: useTransform(progress, (value) => -Math.cos(value * Math.PI * 2 * strokes) * lean),
  }
}
