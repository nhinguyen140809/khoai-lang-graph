import type { FaceShape } from '../look/face-look.types'

/** What the animation file is given of a face that does not change as the face moves: the names are the properties of its view model. */
export interface LiveValues {
  silhouette: FaceShape
  eyeGap: number
  /** How far the eyes sit below the middle of the face, in units, because of the outline. */
  eyeLine: number
  /** Where the eyes rest across the face, in units from its middle. */
  eyeShift: number
  coreX: number
  coreY: number
  secondX: number
  secondY: number
  eyeLeftWidth: number
  eyeLeftHeight: number
  eyeLeftTilt: number
  eyeRightWidth: number
  eyeRightHeight: number
  eyeRightTilt: number
  /** How much of each eye is drawn as an open oval, as a smiling line and as a shut one: 1 for the one the kind of the eye says, 0 for the others. */
  eyeLeftOpen: number
  eyeLeftArc: number
  eyeLeftShut: number
  eyeRightOpen: number
  eyeRightArc: number
  eyeRightShut: number
  motionSeconds: number
}
