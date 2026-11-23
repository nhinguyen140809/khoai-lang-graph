'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/**
 * The motion of a speech bubble that speaks: its body opens from a small box and swells a little
 * past its size, shaking as it settles, and its tail grows after it with a smaller swell, which is
 * their scale and their angle.
 */
export function useSpeak(progress: MotionValue<number>) {
  return {
    body: {
      scale: useKeyframes(progress, [0.4, 1.2, 1.07, 1]),
      rotate: useKeyframes(progress, [0, -7, 7, 0]),
    },
    tail: {
      scale: useKeyframes(progress, [0, 1.05, 1.02, 1]),
      rotate: useKeyframes(progress, [0, -7, 7, 0]),
    },
  }
}
