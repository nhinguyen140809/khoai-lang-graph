'use client'

import type { MotionValue } from 'motion/react'

import { loopRests } from '../animation.constants'
import type { LoopTracks, LoopValues } from '../animation.types'
import { useTrackValue } from './useTrackValue'

/** Every track of a motion at the point `position` of its round (from 0 to 1), each at rest where the motion does not move it, with `gain` of the motion taken. */
export function useLoopValues(
  position: MotionValue<number>,
  tracks: LoopTracks,
  gain?: MotionValue<number>,
): LoopValues {
  return {
    rotate: useTrackValue(position, tracks.rotate, loopRests.rotate, gain),
    scale: useTrackValue(position, tracks.scale, loopRests.scale, gain),
    scaleX: useTrackValue(position, tracks.scaleX, loopRests.scaleX, gain),
    scaleY: useTrackValue(position, tracks.scaleY, loopRests.scaleY, gain),
    x: useTrackValue(position, tracks.x, loopRests.x, gain),
    y: useTrackValue(position, tracks.y, loopRests.y, gain),
    rotateX: useTrackValue(position, tracks.rotateX, loopRests.rotateX, gain),
    rotateY: useTrackValue(position, tracks.rotateY, loopRests.rotateY, gain),
    opacity: useTrackValue(position, tracks.opacity, loopRests.opacity, gain),
  }
}
