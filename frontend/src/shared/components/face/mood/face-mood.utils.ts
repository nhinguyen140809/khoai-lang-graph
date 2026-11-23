import { type FaceState, type Mood, moods, type RestingMood } from '../face.types'
import { moodCycles, restingStates } from './face-mood.constants'

/** Whether a face in this mood comes to rest when it has nothing to do. */
export function isRestingMood(mood: Mood): mood is RestingMood {
  return mood in restingStates
}

/** The mood that a state comes from: the mood itself, the mood that comes to rest in it, or the mood that goes through it. */
export function moodOfState(state: FaceState): Mood {
  const own = moods.find((mood) => mood === state)
  if (own !== undefined) return own
  const resting = moods.find(
    (mood) => mood in restingStates && restingStates[mood as RestingMood] === state,
  )
  if (resting !== undefined) return resting
  const cycling = moods.find((mood) => moodCycles[mood]?.some((step) => step.state === state))
  return cycling ?? 'idle'
}
