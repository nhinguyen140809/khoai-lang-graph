'use client'

import { useMotionValue, useReducedMotion, useTransform } from 'motion/react'

import { useClock } from '@/shared/lib/animation'

import { glintMorphMs } from '../glint.constants'
import { mixAt, starAt } from '../glint.utils'

/**
 * The shape of the star and the mix of its two colors over its round, from one clock, so that the
 * star and the glow under it, which share these values, never drift apart. For a user who asked for
 * less motion the clock stops at the start of the round: a star that does not change. Out of sight
 * (`isRunning` false) it is held where it is.
 */
export function useGlintMorph(isRunning: boolean) {
  const isStill = useReducedMotion() === true
  const progress = useMotionValue(0)

  useClock(
    progress,
    { durationMs: isStill ? null : glintMorphMs, start: 0, isMirrored: false },
    isRunning,
  )

  return { clipPath: useTransform(progress, starAt), mix: useTransform(progress, mixAt) }
}
