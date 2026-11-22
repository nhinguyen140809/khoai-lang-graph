import type { MotionValue } from 'motion/react'

/**
 * What a face is doing or feeling: nothing in particular, thinking, working on something, waiting
 * for someone, glad, worried, taken by surprise, or asleep.
 */
export const moods = [
  'idle',
  'thinking',
  'working',
  'waiting',
  'happy',
  'worried',
  'surprised',
  'sleeping',
] as const

export type Mood = (typeof moods)[number]

/** The moods whose face comes to rest after a long time of nothing to do: it stands still, and only an eye that can blink blinks. */
export type RestingMood = 'idle' | 'happy'

/** What a face looks like: one of its moods, or at rest in one of the moods that come to rest, which is not a mood that anyone sets. */
export type FaceState = Mood | `resting-${RestingMood}`

/** Where the eyes look: now and then to the sides (`drift` is the same, much smaller), slowly from side to side only (`glance`), up and to the left and held long with a glance down now and then (`ponder`), along a line as if reading, down, to the side and held there (`toward`), or ahead. */
export type Gaze = 'wander' | 'drift' | 'ponder' | 'glance' | 'scan' | 'down' | 'toward' | 'still'

/** The eyes of a face: long ones, round ones, a long oval one and a flat oval one, closed smiling arcs, or shut ones. */
export type EyeKind = 'long' | 'round' | 'tall' | 'flat' | 'arc' | 'shut'

/** How a mood moves the blobs of a face: not at all, or by drifting. */
export type Pace = 'calm' | 'busy'

/** What the whole face does: nothing, a pulse that makes it larger and smaller, a slow breath, hops from side to side, or a full turn about its vertical axis now and then. */
export type Body = 'none' | 'pulse' | 'breathe' | 'bounce' | 'turnaround'

/** How the whole face moves in the plane of the page: a small sway, a slow tilt to one side and then the other, or a very slow breath. */
export type Pose = 'sway' | 'tilt' | 'rest'

/** What an eye does by itself: nothing, swells and shrinks slowly, or squints now and then. */
export type EyeLife = 'steady' | 'breathe' | 'squint'

/** What a mood does to a face. Each of its parts is given for the left eye and for the right eye. */
export interface MoodLook {
  gaze: Gaze
  /** The kind of each eye. */
  eyes: readonly [EyeKind, EyeKind]
  /** How large each eye is, as a multiple of its usual size. */
  eyeScales: readonly [number, number]
  /** How far each eye leans at rest, in degrees, clockwise; a gaze that moves the eyes leans them as it likes. */
  tilts: readonly [number, number]
  /** Whether the blobs drift: they do for a face that is at work. */
  pace: Pace
  /** What the whole face does; nothing when it is not given. */
  body?: Body
  /** How the whole face moves in the plane of the page, pivoting on its bottom; not at all when it is not given. */
  pose?: Pose
  /** What each eye does by itself, besides the way the eyes look; steady when it is not given. */
  eyeLives?: readonly [EyeLife, EyeLife]
}

/** The size of an eye of a kind, in the units of the face, as half of its width and half of its height. */
export interface EyeGeometry {
  halfWidth: number
  halfHeight: number
}

/** The motions that the eyes can follow, each a path over time (see `gazePaths`). */
export type GazePath = 'wander' | 'ponder' | 'glance' | 'scan' | 'toward'

/** A path of the eyes: how long one round takes (none for a path that holds the eyes at one place), and where the eyes are along it, as stops of the round (from 0 to 1), the number of units to the right and the number down. */
export interface GazePathLook {
  durationMs: number
  stops: readonly (readonly [number, number, number])[]
}

/** How the whole face turns with the eyes, in degrees: to the side and up per unit of the path, a roll per unit to the side, and a bow that stays. */
export interface HeadTurn {
  turn: number
  lift: number
  roll: number
  bow: number
}

/** How the eyes look where they look: the path they follow and how much of it, how the face turns with them, and where they rest. */
export interface GazeLook {
  /** The path of the eyes; none for eyes that keep still. */
  path: GazePath | null
  /** How much of the path the eyes take: a small drift or a wide look. */
  gain: number
  /** How the face turns with the eyes; none for a face that does not turn. */
  head: HeadTurn | null
  /** Where the eyes rest, in the units of the face; the path moves them from there. */
  rest: { x: number; y: number }
}

/** What follows the gaze, as it changes over time: the move and roll of each eye, and the turns of the face. */
export interface GazeValues {
  eye: { x: MotionValue<number>; y: MotionValue<number>; roll: MotionValue<number> }
  head: {
    rotateX: MotionValue<number>
    rotateY: MotionValue<number>
    rotateZ: MotionValue<number>
  }
}

/**
 * What something outside the face can steer, each part optional. `look` is where the face looks, in
 * the units of a gaze path (0 is straight ahead; the paths of the moods reach about 2.6 to a side),
 * and `weight` how much of its own gaze the face gives up for it, from 0 to 1, so that a look takes
 * over and lets go gently. `move` is added to the move of the whole face: a share of its size to the
 * right and down, a turn in degrees, and a scale where 1 is its own size. The face keeps its mood;
 * only what it looks at and how it sits changes.
 */
export interface FaceDrive {
  look?: { x: MotionValue<number>; y: MotionValue<number>; weight: MotionValue<number> }
  move?: {
    x: MotionValue<number>
    y: MotionValue<number>
    rotate: MotionValue<number>
    scale: MotionValue<number>
  }
}

/** When a face moves: where along its rounds it starts, whether its mood is changing, whether it runs at all (not when it is out of sight), and how much of the extra reach of the eyes its outline has room for. */
export interface GazeTiming {
  phase: number
  isChanging: boolean
  isRunning: boolean
  reachShare: number
}

/** What a face is given, whichever way it is drawn. */
export interface FaceProps {
  /** What the face comes from, such as the key of an agent: its outline and its colors come from it alone. */
  seed: string
  /** The place of the agent in its workflow: with it, the face is the one made by hand at that place, so that no two agents of a workflow share a face; without it, the seed picks one. */
  place?: number | undefined
  /** What it is doing or feeling; idle by default. A change of mood is covered by a blink. */
  mood?: Mood
  /** What steers the look and the move of the face from outside, such as the acts around it; the mood stays its own. */
  drive?: FaceDrive | undefined
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  className?: string
}

/** The ways that a face is drawn: plain, in CSS, which needs nothing to load; or live, by an animation file, which has more motion. */
export const faceStyleKeys = ['plain', 'live'] as const

export type FaceStyleKey = (typeof faceStyleKeys)[number]
