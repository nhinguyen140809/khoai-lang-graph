'use client'

import type { EasingFunction, MotionValue } from 'motion/react'

import { useTrackValue } from './useTrackValue'

/** A value that goes through `values`, evenly spaced over the round that `position` goes along (from 0 to 1), each stretch eased as `ease` says. */
export function useKeyframes(
  position: MotionValue<number>,
  values: readonly number[],
  ease?: EasingFunction,
): MotionValue<number> {
  return useTrackValue(position, { values, ...(ease !== undefined && { ease }) }, 0)
}
