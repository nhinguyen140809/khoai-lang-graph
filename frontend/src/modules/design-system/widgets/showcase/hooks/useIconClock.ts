import { useMotionValue } from 'motion/react'
import { useState } from 'react'

import { useClock } from '@/shared/lib/animation'
import { usePrefersReducedMotion } from '@/shared/lib/viewport'

/** How long one round of a drawn thing takes, for each speed of the cards. */
export const iconSpeeds = { slow: 4800, normal: 3600, fast: 1200 } as const

export type IconSpeed = keyof typeof iconSpeeds

/**
 * The clock the samples of a card are drawn by: it starts still for a user who asked for less
 * motion, and the user can pause it and speed it up.
 */
export function useIconClock() {
  const isStill = usePrefersReducedMotion()
  const [isPlaying, setIsPlaying] = useState(!isStill)
  const [speed, setSpeed] = useState<IconSpeed>('normal')
  const progress = useMotionValue(0)
  useClock(progress, { durationMs: iconSpeeds[speed], start: 0, isMirrored: false }, isPlaying)
  return { isPlaying, setIsPlaying, speed, setSpeed, progress }
}
