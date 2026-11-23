import type { FaceLooks } from '../face.types'
import type { HumanMoodLook } from './human-face.types'

/** How much of every gaze the face of a person takes, as a multiple of the one of an agent: its eyes are drawn, so they move as a picture does, and less is more. */
export const humanGazeScale = 0.5

/**
 * What each mood does to the face of a person: where the eyes look, and how the head and the body
 * move. The head sways while it thinks and works, tilts when worried; the body breathes at rest,
 * bounces when glad and pulses when surprised. The other states take the look of their mood.
 */
export const humanLooks: FaceLooks<HumanMoodLook> = {
  idle: { gaze: 'drift', body: 'breathe' },
  thinking: { gaze: 'ponder', pose: 'sway' },
  working: { gaze: 'scan', pose: 'sway' },
  waiting: { gaze: 'glance' },
  happy: { gaze: 'still', body: 'bounce' },
  worried: { gaze: 'down', pose: 'tilt' },
  surprised: { gaze: 'still', body: 'pulse' },
  sleeping: { gaze: 'still', isEyesShut: true },
}
