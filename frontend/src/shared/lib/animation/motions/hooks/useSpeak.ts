'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/** The motion of a speech bubble that speaks: it swells and shakes a little, which is its scale and its angle. */
export function useSpeak(progress: MotionValue<number>) {
  return {
    scale: useKeyframes(progress, [1, 1.05, 1.05, 1]),
    rotate: useKeyframes(progress, [0, -7, 7, 0]),
  }
}
