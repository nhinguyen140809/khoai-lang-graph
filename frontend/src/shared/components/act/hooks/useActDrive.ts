'use client'

import { easeInOut, type MotionValue, useMotionValue, useTransform } from 'motion/react'

import type { FaceDrive } from '@/shared/components/face'
import { useClock, useLoopValues } from '@/shared/lib/animation'

import { restingLook, slotPlaces } from '../act.constants'
import type { Act } from '../act.types'
import { faceMoves } from '../act-motion.constants'

/**
 * What an act asks of the face it is around: the round of the act as a clock, and from it where the
 * eyes look (the slot at each point of the round) and how the face moves as a whole (the move of
 * the act, as many times over the round as it says). `gain` is how much of it is taken, so that the
 * act takes the face over and lets go gently; with no act the face is left to its own mood. The
 * round runs while `isRunning`, and starts again for each act (`swaps`).
 */
export function useActDrive(
  act: Act | null,
  swaps: number,
  gain: MotionValue<number>,
  isRunning: boolean,
): { drive: FaceDrive; round: MotionValue<number> } {
  const time = useMotionValue(0)
  useClock(time, { durationMs: act?.loopMs ?? null, start: swaps, isMirrored: false }, isRunning)
  const round = useTransform(time, (value) => value % 1)
  const moveAt = useTransform(round, (value) => (value * (act?.move?.cycles ?? 1)) % 1)
  const moved = useLoopValues(moveAt, act?.move === undefined ? {} : faceMoves[act.move.move], gain)

  const lookX = useLookAxis(round, act, 'x')
  const lookY = useLookAxis(round, act, 'y')
  const weight = useTransform(gain, (value) => (act === null ? 0 : value))

  return {
    drive: {
      look: { x: lookX, y: lookY, weight },
      move: { x: moved.x, y: moved.y, rotate: moved.rotate, scale: moved.scale },
    },
    round,
  }
}

/** Where the eyes look along one axis over the round of the act, easing from stop to stop; at rest with no act. */
function useLookAxis(
  round: MotionValue<number>,
  act: Act | null,
  axis: 'x' | 'y',
): MotionValue<number> {
  const stops = act?.look ?? restingLook
  return useTransform(
    round,
    stops.map(([at]) => at),
    stops.map(([, slot]) => (act === null ? 0 : slotPlaces[slot].look[axis])),
    { ease: easeInOut },
  )
}
