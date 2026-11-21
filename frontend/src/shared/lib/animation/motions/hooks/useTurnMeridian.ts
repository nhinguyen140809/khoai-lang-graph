'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of the meridian of a globe that turns: how wide its ellipse is, from a line to a full curve and back. */
export function useTurnMeridian(progress: MotionValue<number>) {
  return useTransform(progress, (value) => 0.5 + 4.5 * Math.abs(Math.cos(value * Math.PI * 2)))
}
