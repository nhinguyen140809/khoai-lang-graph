import type { Mood, RestingMood } from '../face.types'
import { restingStates } from './face-mood.constants'

/** Whether a face in this mood comes to rest when it has nothing to do. */
export function isRestingMood(mood: Mood): mood is RestingMood {
  return mood in restingStates
}
