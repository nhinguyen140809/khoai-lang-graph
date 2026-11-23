import { cubicBezier, easeInOut } from 'motion/react'

import type { Loop } from '@/shared/lib/animation'

import type { Body, Pose } from '../face.types'

// The motions of the whole face that repeat, by pose (in the plane of the page, pivoting on the
// bottom) and by body (the face as a whole, about the middle of its depth). A mood chooses among
// them in the looks of the moods of a face. Sizes and turns are as the face sees them: a scale of 1 and a turn of 0 are rest.

/** How the face moves in the plane of the page. */
export const poseLoops: Readonly<Record<Pose, Loop>> = {
  // A happy face sways a little.
  sway: {
    durationMs: 1700,
    isMirrored: true,
    tracks: { rotate: { values: [-4, 4], ease: easeInOut } },
  },
  // A thinking face tilts to one side and holds, comes back, tilts to the other and holds.
  tilt: {
    durationMs: 6000,
    tracks: {
      rotate: {
        times: [0, 0.12, 0.38, 0.5, 0.62, 0.88, 1],
        values: [0, 8, 8, 0, -6, -6, 0],
        ease: easeInOut,
      },
    },
  },
  // A waiting face breathes very slowly, hardly at all.
  rest: {
    durationMs: 4400,
    isMirrored: true,
    tracks: { scale: { values: [0.985, 1.015], ease: easeInOut } },
  },
}

const landing = cubicBezier(0.15, 0.7, 0.4, 1)
const falling = cubicBezier(0.6, 0, 0.85, 0.3)

/** What the whole face does by the mood; nothing for a mood that is not in the table. */
export const bodyLoops: Readonly<Record<Body, Loop | null>> = {
  none: null,
  // A face taken by surprise zooms in slowly, then fast, then slowly again, and out at a steady pace.
  pulse: {
    durationMs: 2600,
    tracks: {
      scale: {
        times: [0, 0.6, 1],
        values: [0.97, 1.22, 0.97],
        ease: [cubicBezier(0.75, 0, 0.25, 1), cubicBezier(0, 0, 1, 1)],
      },
    },
  },
  // A sleeping face breathes: a little larger and smaller.
  breathe: {
    durationMs: 4200,
    isMirrored: true,
    tracks: { scale: { values: [0.96, 1.03], ease: easeInOut } },
  },
  // A face jumps straight up and down, off the ground: it squashes where it lands, stretches as it rises, and falls faster than it rose.
  bounce: {
    durationMs: 800,
    tracks: {
      y: {
        times: [0, 0.5, 1],
        values: [0, -0.42, 0],
        ease: [landing, falling],
      },
      scaleX: {
        times: [0, 0.5, 1],
        values: [1.14, 0.95, 1.14],
        ease: [landing, falling],
      },
      scaleY: {
        times: [0, 0.5, 1],
        values: [0.84, 1.1, 0.84],
        ease: [landing, falling],
      },
    },
  },
  // A waiting face turns right around now and then, a different way each time: the first turn is about its vertical axis, the next about its horizontal axis. Each takes 0.7 seconds of a 20-second round.
  turnaround: {
    durationMs: 20000,
    isPhased: true,
    tracks: {
      rotateY: { times: [0, 0.45, 0.485, 1], values: [0, 0, 360, 360], ease: easeInOut },
      rotateX: { times: [0, 0.95, 0.985, 1], values: [0, 0, 360, 360], ease: easeInOut },
    },
  },
}
