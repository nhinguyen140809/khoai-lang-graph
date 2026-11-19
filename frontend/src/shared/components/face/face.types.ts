import type { EyeShape } from './face-look.types'

/**
 * What a face is doing or feeling: nothing in particular, thinking, working on something, waiting
 * for someone, glad, worried, taken by surprise, or tired.
 */
export const moods = [
  'idle',
  'thinking',
  'working',
  'waiting',
  'happy',
  'worried',
  'surprised',
  'sleepy',
] as const

export type Mood = (typeof moods)[number]

/** Where the eyes look: now and then to the sides, round and round, along a line as if reading, down, or ahead. */
export type Gaze = 'wander' | 'circle' | 'scan' | 'down' | 'still'

/** A brow over an eye: none, a light arch, a flat line, a high arch, or slanting up to the nose. */
export type Brow = 'none' | 'arch' | 'flat' | 'raised' | 'slant'

/** The eyes of a face: the shapes of the seed, closed arcs, or half lids. */
export type EyeKind = EyeShape | 'arc' | 'lid'

/** What a mood does to a face. `eyes` is null to leave the eyes of the seed as they are. */
/** How a mood moves the blobs of a face: not at all, or by drifting. */
export type Pace = 'calm' | 'busy'

export interface MoodLook {
  gaze: Gaze
  /** The left brow and the right brow. */
  brows: readonly [Brow, Brow]
  eyes: EyeKind | null
  /** How large the eyes are, as a multiple of their usual size. */
  eyeScale: number
  /** Whether the blobs drift: they do for a face that is at work. */
  pace: Pace
}

/** The size of an eye of a kind, in the units of the face, as half of its width and half of its height. */
export interface EyeGeometry {
  halfWidth: number
  halfHeight: number
}

/** How the eyes look where they look: the motion they have, the token of its time, and where they rest. */
export interface GazeLook {
  /** The class of the motion, whole, so that it is generated; none for eyes that rest. */
  className: string
  /** The token of the time of the motion, to start each face part of the way through it. */
  durationToken: string | null
  /** Where the eyes rest, in the units of the face; the motion moves them from there. */
  rest: { x: number; y: number }
}
