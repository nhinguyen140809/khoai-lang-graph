'use client'

import type { MotionValue } from 'motion/react'

import { useKeyframes } from '../../hooks/useKeyframes'

/** The motion of an arrow that dips down into a tray and comes back: how far down it is. */
export function useDipIntoTray(progress: MotionValue<number>) {
  return useKeyframes(progress, [0, 2.5, 0])
}
