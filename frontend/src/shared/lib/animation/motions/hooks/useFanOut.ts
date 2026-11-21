'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of layers that fan out and close up again: how far the top layer goes up and the bottom one goes down. */
export function useFanOut(progress: MotionValue<number>) {
  const spread = useTransform(progress, (value) => 1.5 * Math.sin(value * Math.PI * 2) ** 2)
  return {
    up: useTransform(spread, (value) => -value),
    down: useTransform(spread, (value) => value),
  }
}
