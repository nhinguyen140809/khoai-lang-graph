import type { EyeGeometry, EyeKind, Gaze, GazeLook, Mood, MoodLook, Pace } from './face.types'
import type { BlobShape, EyeGap } from './face-look.types'

/** The face is drawn in a square of this many units; its eyes sit on this line, in the middle. */
export const faceUnits = 32
export const eyeLine = 16

/** The size of each kind of eye. Everything drawn about an eye, and over it, is worked out from this. */
export const eyeGeometries = {
  round: { halfWidth: 3.6, halfHeight: 3.6 },
  long: { halfWidth: 2.4, halfHeight: 4.8 },
  slim: { halfWidth: 4.2, halfHeight: 2.2 },
  arc: { halfWidth: 3.6, halfHeight: 1.8 },
  lid: { halfWidth: 3.6, halfHeight: 1.2 },
} as const satisfies Record<EyeKind, EyeGeometry>

/** The clear space between the two eyes, by how far apart they are: it comes on top of the width of the eyes. */
export const eyeSpacing = { near: 2, mid: 3.6, far: 5.2 } as const satisfies Record<EyeGap, number>

/** The classes of a blob by its shape; whole class names, so that they are generated. */
export const blobShapeClasses = {
  round: 'face-shape-round',
  blob: 'face-shape-blob',
  ellipse: 'face-shape-ellipse',
  streak: 'face-shape-streak',
} as const satisfies Record<BlobShape, string>

/** The motion of the blobs by the pace of a mood: they drift while a face is at work. */
export const blobMotionClasses = {
  calm: '',
  busy: 'animate-face-blob motion-reduce:animate-none',
} as const satisfies Record<Pace, string>

export const faceSizeClasses = { sm: 'size-6', default: 'size-8', lg: 'size-10' } as const

/** What each mood does to a face. */
export const moodLooks = {
  idle: { gaze: 'wander', brows: ['none', 'none'], eyes: null, eyeScale: 1, pace: 'calm' },
  thinking: { gaze: 'circle', brows: ['raised', 'flat'], eyes: null, eyeScale: 1, pace: 'busy' },
  working: { gaze: 'scan', brows: ['flat', 'flat'], eyes: null, eyeScale: 1, pace: 'busy' },
  waiting: { gaze: 'down', brows: ['arch', 'arch'], eyes: null, eyeScale: 1, pace: 'calm' },
  happy: { gaze: 'still', brows: ['none', 'none'], eyes: 'arc', eyeScale: 1, pace: 'calm' },
  worried: { gaze: 'still', brows: ['slant', 'slant'], eyes: null, eyeScale: 1, pace: 'calm' },
  surprised: {
    gaze: 'still',
    brows: ['raised', 'raised'],
    eyes: null,
    eyeScale: 1.25,
    pace: 'calm',
  },
  sleepy: { gaze: 'still', brows: ['none', 'none'], eyes: 'lid', eyeScale: 1, pace: 'calm' },
} as const satisfies Record<Mood, MoodLook>

/** How the eyes look for each gaze; the classes are whole, so that they are generated. */
export const gazeLooks = {
  wander: {
    className: 'animate-face-wander motion-reduce:animate-none',
    durationToken: '--duration-face-wander',
    rest: { x: 0, y: 0 },
  },
  circle: {
    className: 'animate-face-circle motion-reduce:animate-none',
    durationToken: '--duration-face-circle',
    rest: { x: 0, y: 0 },
  },
  scan: {
    className: 'animate-face-scan motion-reduce:animate-none',
    durationToken: '--duration-face-scan',
    rest: { x: 0, y: 0 },
  },
  down: { className: '', durationToken: null, rest: { x: 0, y: 1.6 } },
  still: { className: '', durationToken: null, rest: { x: 0, y: 0 } },
} as const satisfies Record<Gaze, GazeLook>

/** How long a change of mood waits for the eyes to close before it goes on, if they never say they have, in milliseconds. */
export const swapFallbackMs = 600
