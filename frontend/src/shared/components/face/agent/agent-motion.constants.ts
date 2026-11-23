import type { Body, EyeLife, Gaze, Pose } from '../face.types'
import type { EyeKind, Pace } from './agent-face.types'

// The classes of the named motions of the face of an agent (see `agent-motion.css`). Every class is written whole,
// so that it is generated. A mood chooses among these in `moodLooks`.

/** The motion of the blobs by the pace of a mood: they drift while a face is at work. */
export const blobMotionClasses = {
  calm: '',
  busy: 'animate-face-blob motion-reduce:animate-none',
} as const satisfies Record<Pace, string>

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
  wink: {
    className: 'animate-face-eye-wink motion-reduce:animate-none',
    durationToken: '--duration-face-wink',
  },
} as const satisfies Record<EyeLife, { className: string; durationToken: string | null }>

/** Every motion that a face can have, by kind, for a page that shows them one at a time. A body that is `none` and a gaze that holds the eyes are not listed: they move nothing. */
export const faceMotions = {
  poses: ['sway', 'tilt', 'rest'],
  bodies: ['pulse', 'breathe', 'bounce', 'turnaround'],
  eyes: ['long', 'round', 'tall', 'flat', 'arc', 'shut', 'cross', 'spiral'],
  eyeLives: ['steady', 'breathe', 'squint', 'wink'],
  gazes: ['wander', 'drift', 'ponder', 'glance', 'scan', 'down', 'toward', 'still'],
} as const satisfies {
  poses: readonly Pose[]
  bodies: readonly Exclude<Body, 'none'>[]
  eyes: readonly EyeKind[]
  eyeLives: readonly EyeLife[]
  gazes: readonly Gaze[]
}
