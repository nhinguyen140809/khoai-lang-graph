import type { LoopTrack } from './animation.types'

/** How long content takes to come in or go out, in milliseconds. */
export const motionMs = 200

/** What a track is when nothing moves it. */
export const loopRests: Readonly<Record<LoopTrack, number>> = {
  rotate: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
  rotateX: 0,
  rotateY: 0,
  opacity: 1,
}
