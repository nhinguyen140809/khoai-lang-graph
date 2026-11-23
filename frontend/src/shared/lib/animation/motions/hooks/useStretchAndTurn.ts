'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/** The motion of a link of a chain that stretches apart and comes back as it turns a little: how much of its line is drawn, how far the line is moved, and its angle. */
export function useStretchAndTurn(progress: MotionValue<number>) {
  return {
    pathLength: useKeyframes(progress, [1, 0.97, 1, 0.97, 1]),
    pathOffset: useKeyframes(progress, [0, 0.05, 0, 0.05, 0]),
    rotate: useKeyframes(progress, [0, -5, 0]),
  }
}
