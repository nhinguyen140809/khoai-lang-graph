import type { MotionStyle, MotionValue } from 'motion/react'

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

/** What a face looks like: one of its moods, at rest in one of the moods that come to rest, or at a step of a mood that goes through looks; none of the last two is a mood that anyone sets. */
/** A step of a mood that goes through looks one after another, besides the first, which is the mood itself. */
export type CycleStep = 'thinking-long' | 'thinking-squint'

export type FaceState = Mood | `resting-${RestingMood}` | CycleStep

/** Where the eyes look: now and then to the sides (`drift` is the same, much smaller), slowly from side to side only (`glance`), up and to the left and held long with a glance down now and then (`ponder`), along a line as if reading, down, to the side and held there (`toward`), or ahead. */
export type Gaze = 'wander' | 'drift' | 'ponder' | 'glance' | 'scan' | 'down' | 'toward' | 'still'

/** What the whole face does: nothing, a pulse that makes it larger and smaller, a slow breath, hops from side to side, or a full turn about its vertical axis now and then. */
export type Body = 'none' | 'pulse' | 'breathe' | 'bounce' | 'turnaround'

/** How the head, or the face, moves in the plane of the page: a small sway, or a slow tilt to one side and then the other. */
export type Pose = 'sway' | 'tilt'

/** What an eye does by itself: nothing, swells and shrinks slowly, or squints now and then. */
export type EyeLife = 'steady' | 'breathe' | 'squint' | 'wink'

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

/** What a mood does to the whole of a face, whatever the face is drawn of: where it looks, what it does as a whole, and how it moves in the plane of the page. */
export interface MotionLook {
  gaze: Gaze
  /** What the whole body does, the whole of the face for a face that has no body apart from it; nothing when it is not given. */
  body?: Body
  /** How the head, or the face, moves in the plane of the page, pivoting on its bottom (the neck, for a head); not at all when it is not given. */
  pose?: Pose
}

/** What a motion of the eyes needs of a face: what each eye does by itself, and whether the eyes may blink at all. */
export interface EyesMotion {
  lives: readonly [EyeLife, EyeLife]
  canBlink: boolean
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

/** When a face moves: where along its rounds it starts, whether its mood is changing, whether it runs at all (not when it is out of sight), and how much of the extra reach of the eyes it has room for, from none to all (1: a face whose eyes have all the room that they need). */
export interface GazeTiming {
  phase: number
  isChanging: boolean
  isRunning: boolean
  reachShare: number
}

/** What a face is given, whichever kind of face it is: an agent, a person. */
export interface FaceProps {
  /** What the face comes from, such as the key of an agent: its outline and its colors come from it alone. */
  seed: string
  /** What it is doing or feeling; idle by default. A change of mood is covered by a blink. */
  mood?: Mood
  /** What steers the look and the move of the face from outside, such as the acts around it; the mood stays its own. */
  drive?: FaceDrive | undefined
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  className?: string
}

/** When a face moves (see `GazeTiming`; `isRunning` is found here), and how much of its gaze it takes: all of it (1) unless this says less. */
export type FaceMotionTiming = Omit<GazeTiming, 'isRunning'> & { gazeScale?: number }

/** What moves the body of a face, as the values of its style: where it is, how it is turned and how large it is. */
export interface BodyStyle {
  x: MotionValue<string>
  y: MotionValue<string>
  rotate: MotionValue<number>
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  scale: MotionValue<number>
  scaleX: MotionValue<number>
  scaleY: MotionValue<number>
}

/** What moves a face by its mood, as the style of the element for each part that moves: the pose (the plane of the page, pivoting on the bottom), the head (its turns with the eyes) and the body. */
export interface FaceStyles {
  poseStyle: MotionStyle
  headStyle: GazeValues['head']
  bodyStyle: BodyStyle
}
