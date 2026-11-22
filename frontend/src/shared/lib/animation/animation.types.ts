import type { EasingFunction, MotionValue } from 'motion/react'

/** The width and height of an element in pixels, border and padding included. */
export interface ElementSize {
  width: number
  height: number
}

/** What a loop moves: a turn in the plane of the page, a size (as a whole and along each side), a move in shares of the size of what moves, turns in depth, and how much it shows. */
export type LoopTrack =
  'rotate' | 'scale' | 'scaleX' | 'scaleY' | 'x' | 'y' | 'rotateX' | 'rotateY' | 'opacity'

/** One thing that a loop moves over a round: where it is at stops of the round (from 0 to 1, evenly spaced when not given), and how it eases between them. */
export interface LoopStops {
  values: readonly number[]
  times?: readonly number[]
  ease?: EasingFunction | EasingFunction[]
}

/** What a motion moves, each track by its stops. */
export type LoopTracks = Partial<Record<LoopTrack, LoopStops>>

/** A motion that repeats: how long a round takes, whether it goes back the way it came, whether each element that has it starts at a point of its own, and what it moves. */
export interface Loop {
  durationMs: number
  isMirrored?: boolean
  isPhased?: boolean
  tracks: LoopTracks
}

/** What a motion moves over time, each track as a value that is at rest when the motion does not take it. */
export type LoopValues = Record<LoopTrack, MotionValue<number>>
