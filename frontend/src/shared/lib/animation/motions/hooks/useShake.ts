'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/** The motion of a mark that shakes from side to side: its angle, in degrees, which goes to each side and back. */
export function useShake(progress: MotionValue<number>) {
  return useKeyframes(progress, [0, -10, 10, -10, 0])
}
