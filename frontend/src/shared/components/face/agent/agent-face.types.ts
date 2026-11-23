import type { EyeLife, FaceProps, FaceState, MotionLook } from '../face.types'

/** The eyes of a face: long ones, round ones, a long oval one and a flat oval one, closed smiling arcs, or shut ones. */
export type EyeKind = 'long' | 'round' | 'tall' | 'flat' | 'arc' | 'shut' | 'cross' | 'spiral'

/** How a mood moves the blobs of a face: not at all, or by drifting. */
export type Pace = 'calm' | 'busy'

/** What a mood does to the eyes and the blobs of the face of an agent. Each of the parts of the eyes is given for the left eye and for the right eye. */
export interface PlainEyesLook {
  /** The kind of each eye. */
  eyes: readonly [EyeKind, EyeKind]
  /** How large each eye is, as a multiple of its usual size. */
  eyeScales: readonly [number, number]
  /** How far each eye leans at rest, in degrees, clockwise; a gaze that moves the eyes leans them as it likes. */
  tilts: readonly [number, number]
  /** Whether the blobs drift: they do for a face that is at work. */
  pace: Pace
  /** What each eye does by itself, besides the way the eyes look; steady when it is not given. */
  eyeLives?: readonly [EyeLife, EyeLife]
}

/** What a mood does to the face of an agent: to the whole of it, and to its eyes and blobs. */
export type AgentMoodLook = MotionLook & PlainEyesLook

/** The size of an eye of a kind, in the units of the face, as half of its width and half of its height. */
export interface EyeGeometry {
  halfWidth: number
  halfHeight: number
}

/** Parts of what a mood does to a face that something else says instead of the mood, such as a design page that shows one motion at a time. */
export type MoodOverride = Partial<
  Pick<AgentMoodLook, 'gaze' | 'eyes' | 'eyeScales' | 'tilts' | 'pose' | 'body' | 'eyeLives'>
>

/** What the face of an agent is given: what every face is given, and parts of the look of the mood to say otherwise. */
export interface AgentFaceProps extends FaceProps {
  /** Parts of the look of the mood to say otherwise, each replacing the one that the mood gives; the mood stays its own for the rest. */
  override?: MoodOverride | undefined
  /** A state to show as it is, in place of the one that the mood gives, for a page that shows every state, even those that no one sets, such as the rest of an idle face. */
  state?: FaceState | undefined
}

/** The ways that a face is drawn: plain, in CSS, which needs nothing to load. */
export const faceStyleKeys = ['plain'] as const

export type FaceStyleKey = (typeof faceStyleKeys)[number]
