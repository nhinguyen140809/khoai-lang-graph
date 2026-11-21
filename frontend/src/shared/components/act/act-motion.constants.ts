import { cubicBezier, easeIn, easeInOut, easeOut } from 'motion/react'

import type { LoopTracks } from '@/shared/lib/animation'

import type { Course, Effect, Entrance, Exit, FaceMove } from './act.types'

// The motions that an act is made of, each by its name: how a thing comes in and goes, how it
// moves about its slot, what it does in its place, and how the whole face moves with it. Each is
// tracks over a round from 0 to 1, in the units of the tracks (shares of the size of the face for a
// move, degrees for a turn, 1 for the size and the look of a thing as it is).

/** How a thing comes in, from where it is not yet seen (0) to where it stands (1). */
export const entrances: Readonly<Record<Entrance, LoopTracks>> = {
  'zoom-out': {
    scale: { values: [0.4, 1], ease: easeOut },
    opacity: { values: [0, 1], ease: easeOut },
  },
  'fade-in': { opacity: { values: [0, 1] } },
  rise: { y: { values: [0.25, 0], ease: easeOut }, opacity: { values: [0, 1] } },
  // A thing that is there for the whole of its stretch.
  none: {},
  drop: { y: { values: [-0.25, 0], ease: easeOut }, opacity: { values: [0, 1] } },
}

/** How a thing goes, from where it stands (0) to where it is gone (1). */
export const exits: Readonly<Record<Exit, LoopTracks>> = {
  'zoom-in': {
    scale: { values: [1, 0.5], ease: easeIn },
    opacity: { values: [1, 0], ease: easeIn },
  },
  'fade-out': { opacity: { values: [1, 0] } },
  'float-up': { y: { values: [0, -0.25], ease: easeIn }, opacity: { values: [1, 0] } },
  fall: { y: { values: [0, 0.25], ease: easeIn }, opacity: { values: [1, 0] } },
  none: {},
}

/**
 * How a thing moves about its slot over a round that it comes back from.
 * A `burst` goes up from its slot and a `gather` comes down onto it.
 */
export const courses: Readonly<Record<Course, { tracks: LoopTracks; isOrbit?: boolean }>> = {
  stay: { tracks: {} },
  // Round the middle of the face, as far from it as the slot is: the tracks are not used, the place is worked out from the round.
  orbit: { isOrbit: true, tracks: {} },
  float: { tracks: { y: { values: [0, -0.1, 0], ease: easeInOut } } },
  sweep: { tracks: { x: { values: [-0.12, 0.12, -0.12], ease: easeInOut } } },
  hop: {
    tracks: {
      y: {
        values: [0, -0.14, 0, -0.07, 0],
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: [easeOut, easeIn, easeOut, easeIn],
      },
    },
  },
  burst: {
    tracks: {
      y: { values: [0, -0.4], ease: easeOut },
      opacity: { values: [0, 1, 1, 0], times: [0, 0.2, 0.7, 1] },
      scale: { values: [0.6, 1, 1, 0.8], times: [0, 0.2, 0.7, 1] },
    },
  },
  // The other way: from above, down toward where it is gone.
  gather: {
    tracks: {
      y: { values: [-0.3, 0.25], ease: easeIn },
      opacity: { values: [0, 1, 1, 0], times: [0, 0.2, 0.75, 1] },
      scale: { values: [1, 1, 1, 0.5], times: [0, 0.2, 0.75, 1] },
    },
  },
}

/** What a thing does in its place over a round that it comes back from. */
export const effects: Readonly<Record<Effect, LoopTracks>> = {
  pulse: { scale: { values: [1, 1.18, 1], ease: easeInOut } },
  spin: { rotate: { values: [0, 360] } },
  wiggle: { rotate: { values: [0, -10, 10, -10, 0], ease: easeInOut } },
  blink: { opacity: { values: [1, 0.35, 1] } },
  tick: {
    scale: { values: [1, 1.3, 1], times: [0, 0.15, 1], ease: cubicBezier(0.2, 0.7, 0.3, 1) },
  },
}

/** How the whole face moves over a round that it comes back from; a move is in shares of the size of the face, a turn in degrees. */
export const faceMoves: Readonly<Record<FaceMove, LoopTracks>> = {
  bob: { y: { values: [0, -0.07, 0], ease: easeInOut } },
  nod: { rotate: { values: [0, 10, 0], ease: easeInOut } },
  // A short press down and a quick return.
  tap: {
    y: { values: [0, 0.06, 0], times: [0, 0.12, 1], ease: easeOut },
  },
  lean: { rotate: { values: [0, 9, 0, -9, 0], ease: easeInOut } },
  swell: { scale: { values: [1, 1.12, 1], ease: easeInOut } },
}

/** How much of the stretch of a thing it takes to come in, and again to go, as a share of the stretch. */
export const appearShare = 0.15

/** How many times a thing plays its effect over its stretch when it does not say. */
export const defaultEffectCycles = 3
