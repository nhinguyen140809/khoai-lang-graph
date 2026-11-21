'use client'

import { useMotionValue, useTransform } from 'motion/react'

import { type Loop, type LoopValues, useClock, useLoopValues } from '@/shared/lib/animation'
import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import { useFade } from './useFade'

/**
 * Where a repeating motion of the whole face has each of its tracks over time. A loop that goes
 * back the way it came runs its round forward and back; the others start again. A phased loop starts
 * each face at a point of its own, so that faces side by side do not move together. The loop is
 * taken in full once the mood has changed, and not at all while it changes or for a user who asked
 * for less motion. Out of sight (`isRunning` false) the loop is held where it is.
 */
export function useLoop(
  loop: Loop | null,
  phase: number,
  isChanging: boolean,
  isRunning: boolean,
): LoopValues {
  const isStill = usePrefersReducedMotion()
  const isTaken = loop !== null && !isStill
  const clock = useMotionValue(0)
  const gain = useFade(isTaken ? 1 : 0, isChanging)

  useClock(
    clock,
    {
      durationMs: loop === null || isStill ? null : loop.durationMs,
      start: loop?.isPhased === true ? phase : 0,
      isMirrored: loop?.isMirrored === true,
    },
    isRunning,
  )

  const position = useTransform(clock, (value) => (loop?.isMirrored === true ? value : value % 1))
  return useLoopValues(position, loop?.tracks ?? {}, gain)
}
