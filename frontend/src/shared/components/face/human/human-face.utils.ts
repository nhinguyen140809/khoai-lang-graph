import type { EyesMotion } from '../face.types'
import type { HumanMoodLook } from './human-face.types'

/** What the look of a mood asks of the eyes of the face of a person: nothing of their own, and a blink unless they are shut. */
export function eyesMotionOf(look: HumanMoodLook): EyesMotion {
  return { lives: ['steady', 'steady'], canBlink: look.isEyesShut !== true }
}

/** Where along its rounds the face of a seed starts, from 0 up to 1, so that two faces side by side do not move together. */
export function phaseOf(hash: number): number {
  return (hash % 1000) / 1000
}
