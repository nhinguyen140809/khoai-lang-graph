import type { Loop } from '@/shared/lib/animation'

import { eyeGeometries } from '../face.constants'
import type { Body, EyeGeometry, EyeKind, EyeLife, FaceStyleKey, Pose } from '../face.types'
import { bodyLoops, poseLoops } from './face-loop.constants'
import { eyeLifeLooks } from './face-motion.constants'

/**
 * What one motion needs for each way that a face is drawn, as an object with a key for each
 * `FaceStyleKey` (the plain face draws it in CSS and SVG; a way of drawing added later has a key of
 * its own). A way of drawing that an entry does not give is a type error, so a motion cannot be
 * added for one way of drawing and left out of another, and a way of drawing added later asks for
 * every motion that there is.
 */
export type PerStyle<Styles extends Record<FaceStyleKey, unknown>> = Styles

/** The pose of the whole face by its kind (`none` for no pose). */
export const poseMotions = {
  none: { plain: null },
  sway: { plain: poseLoops.sway },
  tilt: { plain: poseLoops.tilt },
  rest: { plain: poseLoops.rest },
} as const satisfies Record<Pose | 'none', PerStyle<{ plain: Loop | null }>>

/** What the whole face does, by kind. */
export const bodyMotions = {
  none: { plain: bodyLoops.none },
  pulse: { plain: bodyLoops.pulse },
  breathe: { plain: bodyLoops.breathe },
  bounce: { plain: bodyLoops.bounce },
  turnaround: { plain: bodyLoops.turnaround },
} as const satisfies Record<Body, PerStyle<{ plain: Loop | null }>>

/** What an eye does by itself, by kind. */
export const eyeLifeMotions = {
  steady: { plain: eyeLifeLooks.steady },
  breathe: { plain: eyeLifeLooks.breathe },
  squint: { plain: eyeLifeLooks.squint },
  wink: { plain: eyeLifeLooks.wink },
} as const satisfies Record<EyeLife, PerStyle<{ plain: { className: string } }>>

/** The kinds of eye: the size of each, which the plain face draws it by (see `FaceEyes`). */
export const eyeMotions = {
  long: { plain: eyeGeometries.long },
  round: { plain: eyeGeometries.round },
  tall: { plain: eyeGeometries.tall },
  flat: { plain: eyeGeometries.flat },
  arc: { plain: eyeGeometries.arc },
  shut: { plain: eyeGeometries.shut },
  cross: { plain: eyeGeometries.cross },
  spiral: { plain: eyeGeometries.spiral },
} as const satisfies Record<EyeKind, PerStyle<{ plain: EyeGeometry }>>

/** The blink: the plain face times it with a machine and draws it in CSS, with the keyframes that this names. */
export const blinkMotion = {
  plain: { animation: 'face-blink' },
} as const satisfies PerStyle<{ plain: { animation: string } }>
