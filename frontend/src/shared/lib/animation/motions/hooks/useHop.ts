'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/** The motion of a thing that hops up and settles back to the side: how far it is to the right and how far it is down. */
export function useHop(progress: MotionValue<number>) {
  return {
    x: useKeyframes(progress, [0, 0, -3, 0]),
    y: useKeyframes(progress, [0, -4, 0, 0]),
  }
}
