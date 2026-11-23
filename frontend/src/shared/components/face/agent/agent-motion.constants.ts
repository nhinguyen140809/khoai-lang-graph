import type { EyeLife } from '../face.types'
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

/** The motions that the eyes of the face of an agent can have, by kind, for a page that shows them one at a time. */
export const plainEyeMotions = {
  eyes: ['long', 'round', 'tall', 'flat', 'arc', 'shut', 'cross', 'spiral'],
  eyeLives: ['steady', 'breathe', 'squint', 'wink'],
} as const satisfies {
  eyes: readonly EyeKind[]
  eyeLives: readonly EyeLife[]
}
