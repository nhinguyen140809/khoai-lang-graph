import type { Mood } from '@/shared/components/face'

/** The acts that a client can show; the keys of the catalog of the workflow definition. */
export const actKeys = [
  'write',
  'read',
  'search',
  'analyze',
  'question',
  'code',
  'calculate',
  'plan',
  'fetch',
  'review',
  'compare',
  'save',
  'typing',
  'interview',
  'summarize',
  'link',
  'export',
] as const

export type ActKey = (typeof actKeys)[number]

/** The sizes of the face of an actor: the largest face there is, and larger. */
export const actSizes = ['lg', 'xl', '2xl'] as const

export type ActSize = (typeof actSizes)[number]

/** The places around a face where something can be put, going round from the top; `center` is the middle of the face, for what goes round it. */
export const slots = [
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
  'top-left',
  'center',
] as const

export type Slot = (typeof slots)[number]

/** The icons that an act puts around a face; each is drawn by the clock of the act. */
export type IconKey =
  | 'textLeft'
  | 'textCenter'
  | 'textRight'
  | 'bars'
  | 'chartSpline'
  | 'check'
  | 'code'
  | 'dot'
  | 'download'
  | 'eventList'
  | 'fork'
  | 'gantt'
  | 'globe'
  | 'help'
  | 'kanban'
  | 'laptop'
  | 'layers'
  | 'library'
  | 'link'
  | 'message'
  | 'nodes'
  | 'pen'
  | 'search'
  | 'send'
  | 'typed'
  | 'ungroup'
  | 'zip'

/** The color of a thing around a face: the primary color of the interface (the default), its text color, or its muted color. */
export const propTones = ['primary', 'foreground', 'muted'] as const

export type PropTone = (typeof propTones)[number]

/** How a thing comes in: zooming out to its size, fading in, rising to its place, or dropping onto it. */
export type Entrance = 'zoom-out' | 'fade-in' | 'rise' | 'drop' | 'none'

/** How a thing goes: zooming in until it is gone, fading out, floating up, or falling. */
export type Exit = 'zoom-in' | 'fade-out' | 'float-up' | 'fall' | 'none'

/** How a thing moves about its slot: not at all, round it, up and down, from side to side, in hops, up from it (burst), or down onto it (gather); a thing may have the up and down of its course go sideways instead, or the sweep go up and down (see `axis`). */
export type Course = 'stay' | 'orbit' | 'float' | 'sweep' | 'hop' | 'burst' | 'gather'

/** What a thing does in its place: swells, turns round, shakes, blinks, or ticks. */
export type Effect = 'pulse' | 'spin' | 'wiggle' | 'blink' | 'tick'

/** How the whole face moves with the work: it bobs, nods, taps, leans, or swells. */
export type FaceMove = 'bob' | 'nod' | 'tap' | 'lean' | 'swell'

/**
 * What a thing is: an icon; some words that show one after another (tokens, such as the sums of a
 * calculation); or the other agent of a work done by two, such as the persona that an interview
 * talks to, which is drawn only when the actor is given one.
 */
export type PropContent =
  | { icon: IconKey; tokens?: never; partner?: never }
  | { tokens: readonly string[]; icon?: never; partner?: never }
  | { partner: true; icon?: never; tokens?: never }

/**
 * One thing around the face: what it is, in which slot (`distance` times as far from the middle of
 * the face as the slot is, moved by `offset`) and the stretch of the round of the act (from 0 to 1)
 * in which it is there. It comes in as `enter` says and goes as `exit` says; its `course` carries
 * it about its slot `courseCycles` times over its stretch, as far as `reach` times the usual; its
 * `effect` plays `effectCycles` times. `copies` puts that many of it, each at a point of its course
 * of its own, so that copies of an `orbit` make a ring round the face and copies of a `burst` go out one after
 * another.
 */
export type ActProp = PropContent & {
  slot: Slot
  from: number
  to: number
  distance?: number
  /** A move from the slot, in shares of the size of the face to the right and down. */
  offset?: { x: number; y: number }
  /** How large it is, as a multiple of the usual. */
  size?: number
  /** For an icon: how thick its strokes are, in units of its 24 by 24 frame; the default stroke of the icons (1.5) when none is given. */
  stroke?: number
  /** Its color: primary by default. */
  tone?: PropTone
  /** Whether it is turned over, so that what points one way points the other. */
  flip?: boolean
  enter?: Entrance
  exit?: Exit
  course?: Course
  /** For an `orbit`: how far the plane of the circle leans away from the screen, in degrees (0 is flat, 90 is seen edge on); the thing is larger on the near side of the face and smaller on the far side, and it fades out as it goes round behind the face and comes back as it comes round, as a satellite does. */
  tilt?: number
  /** For an `orbit`: how far the plane of the circle is turned about the line of sight, in degrees. */
  turn?: number
  /** The way that its course goes: up and down, or sideways, out from the face on the side of its slot and in toward it. A course goes the way that suits it (a sweep from side to side, the rest up and down) unless this says another. */
  axis?: 'vertical' | 'horizontal'
  courseCycles?: number
  reach?: number
  effect?: Effect
  effectCycles?: number
  copies?: number
}

/**
 * What a face does for a kind of work: the mood that it has when the work asks one of it, such as
 * the thinking of a hard problem (unless the caller says another), the
 * round that it goes through again and again, where its eyes are along the round (a slot at each
 * point of it, the same at the end as at the start), how the whole face moves over it (`move`,
 * `cycles` times) and the things around it.
 */
export interface Act {
  mood?: Mood
  loopMs: number
  look: readonly (readonly [number, Slot])[]
  move?: { move: FaceMove; cycles: number }
  props: readonly ActProp[]
}

/** How a thing goes round the face: how far the plane of its ring leans (`tilt`) and turns (`turn`), both in degrees, and how far it reaches as a multiple of the usual. */
export interface OrbitShape {
  tilt: number
  turn: number
  reach: number
}
