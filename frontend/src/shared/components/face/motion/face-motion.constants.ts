import type { EyeLife, Gaze, GazeLook, GazePath, GazePathLook, HeadTurn, Pace } from '../face.types'

// The classes of the named motions of a face (see `face-motion.css`). Every class is written whole,
// so that it is generated. A mood chooses among these in `moodLooks`.

/** The motion of the blobs by the pace of a mood: they drift while a face is at work. */
export const blobMotionClasses = {
  calm: '',
  busy: 'animate-face-blob motion-reduce:animate-none',
} as const satisfies Record<Pace, string>

/** The paths of the eyes: where they are at stops of a round, in the units of the face, as `[stop, right, down]`. Between stops they ease in and out. */
export const gazePaths: Readonly<Record<GazePath, GazePathLook>> = {
  // Glances to six places, with a pause at each and a rest between: mostly the eyes look ahead.
  wander: {
    durationMs: 9000,
    stops: [
      [0, 0, 0],
      [0.1, -3, -1.8],
      [0.22, 3, 0.5],
      [0.34, 2.2, 2.6],
      [0.46, -0.7, -2.8],
      [0.58, -3, 1.9],
      [0.7, 1.4, -1.4],
      [0.82, 0, 0],
      [1, 0, 0],
    ],
  },
  // Slowly to the left, back, to the right, back: sideways only, with long pauses.
  glance: {
    durationMs: 8000,
    stops: [
      [0, 0, 0],
      [0.15, -2.5, 0],
      [0.35, -2.5, 0],
      [0.5, 0, 0],
      [0.65, 2.5, 0],
      [0.85, 2.5, 0],
      [1, 0, 0],
    ],
  },
  // Up and to the left, held long, with a glance down and back.
  ponder: {
    durationMs: 9000,
    stops: [
      [0, -3, -2.4],
      [0.55, -3, -2.4],
      [0.63, -0.5, 0.5],
      [0.7, 1.8, 2.4],
      [0.8, 1.8, 2.4],
      [0.9, -3, -2.4],
      [1, -3, -2.4],
    ],
  },
  // The eyes held to one side and a little down, as if on something there, with nothing that moves.
  toward: {
    durationMs: 0,
    stops: [
      [0, 2.6, 0.3],
      [1, 2.6, 0.3],
    ],
  },
  // One round trip of the eyes: to the middle, a nod there (the eyes dip), then on to the right and all the way back.
  scan: {
    durationMs: 3200,
    stops: [
      [0, -3, 0],
      [0.22, 0, 0],
      [0.26, 0, 0],
      [0.31, 0, 2.4],
      [0.37, 0, 0],
      [0.41, 0, 0],
      [0.62, 3, 0],
      [0.68, 3, 0],
      [1, -3, 0],
    ],
  },
}

/** How long the face takes to give up its motions when a mood changes, and to take those of the next one, in milliseconds. */
export const fadeMs = { out: 160, in: 800 } as const

/** How much farther the eyes travel than the path says, sideways and up and down, so that they look about more than the face turns. Up and down there is less room: a face that is not as tall as it is wide would lose its eyes. */
export const eyeReach = { x: 1.4, y: 1.15 } as const

const headFollows = { turn: 3.3, lift: -4.2, roll: 1, bow: 0 } as const satisfies HeadTurn

/** How the eyes look for each gaze. */
export const gazeLooks = {
  drift: { path: 'wander', gain: 0.4, head: headFollows, rest: { x: 0, y: 0 } },
  glance: { path: 'glance', gain: 1, head: null, rest: { x: 0, y: 0 } },
  ponder: { path: 'ponder', gain: 1, head: headFollows, rest: { x: 0, y: 0 } },
  wander: { path: 'wander', gain: 1, head: headFollows, rest: { x: 0, y: 0 } },
  // The head bows more while the eyes dip.
  scan: {
    path: 'scan',
    gain: 1,
    head: { turn: 1, lift: -1.67, roll: 0, bow: -4 },
    rest: { x: 0, y: 0 },
  },
  // Looking down, the eyes still glance from side to side, a little less than ahead; the face is tipped forward and down and stays so.
  down: {
    path: 'glance',
    gain: 0.7,
    head: { turn: 0, lift: 0, roll: 0, bow: -9 },
    rest: { x: 0, y: 1.6 },
  },
  // The face turns a little to where the eyes look, and keeps there.
  toward: { path: 'toward', gain: 1, head: headFollows, rest: { x: 0, y: 0 } },
  still: { path: null, gain: 0, head: null, rest: { x: 0, y: 0 } },
} as const satisfies Record<Gaze, GazeLook>

/** What an eye does by itself: its class, whole so that it is generated, and the token of the time of its motion, to start each face part of the way through it. */
export const eyeLifeLooks = {
  steady: { className: '', durationToken: null },
  breathe: {
    className: 'animate-face-eye-breathe motion-reduce:animate-none',
    durationToken: '--duration-face-eye-breathe',
  },
  squint: {
    className: 'animate-face-eye-squint motion-reduce:animate-none',
    durationToken: '--duration-face-squint',
  },
} as const satisfies Record<EyeLife, { className: string; durationToken: string | null }>

/** How long one blink takes, in milliseconds: the eyes close and open again. It is the time of `--animate-face-blink`. */
export const blinkMs = 380

/** How long the eyes stay open between two blinks, in milliseconds. */
export const blinkEveryMs = 3420
