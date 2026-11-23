'use client'

import type { MotionValue } from 'motion/react'

import { loopRests, type LoopTracks, useTrackValue } from '@/shared/lib/animation'

/** The tracks of a thing around a face: how it moves, how large it is, how it turns and how much it shows. */
export interface PropTracks {
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  rotate: MotionValue<number>
  opacity: MotionValue<number>
}

/** The tracks of a motion at the point `position` of its round (from 0 to 1), at rest where the motion does not move them. */
export function usePropTracks(position: MotionValue<number>, tracks: LoopTracks): PropTracks {
  return {
    x: useTrackValue(position, tracks.x, loopRests.x),
    y: useTrackValue(position, tracks.y, loopRests.y),
    scale: useTrackValue(position, tracks.scale, loopRests.scale),
    rotate: useTrackValue(position, tracks.rotate, loopRests.rotate),
    opacity: useTrackValue(position, tracks.opacity, loopRests.opacity),
  }
}
