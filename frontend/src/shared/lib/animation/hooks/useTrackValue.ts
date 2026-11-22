'use client'

import { type MotionValue, useMotionValue, useTransform } from 'motion/react'

import type { LoopStops } from '../animation.types'

/**
 * Where one track of a motion is along its round: the value at the point `position` of the
 * round (from 0 to 1) between the stops of the track, eased as it says. `gain` is how much of the
 * motion is taken, from nothing (the track is at its `rest`) to all of it; all of it when none is given.
 */
export function useTrackValue(
  position: MotionValue<number>,
  stops: LoopStops | undefined,
  rest: number,
  gain?: MotionValue<number>,
): MotionValue<number> {
  const whole = useMotionValue(1)
  const values = stops?.values ?? [rest, rest]
  const times = stops?.times ?? values.map((_, index) => index / (values.length - 1))
  const ease = stops?.ease
  const sample = useTransform(position, [...times], [...values], {
    ...(ease !== undefined && { ease }),
  })
  const taken = gain ?? whole
  return useTransform<number, number>(
    [sample, taken],
    ([at, share]) => rest + ((at ?? rest) - rest) * (share ?? 0),
  )
}
