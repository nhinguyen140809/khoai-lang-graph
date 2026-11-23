'use client'

import type { EyesMotion, FaceDrive, FaceLooks, FaceState, Mood, MotionLook } from '../face.types'
import { moodOfState } from '../mood/face-mood.utils'
import { useFaceMood } from '../mood/hooks/useFaceMood'
import { useFaceMotion } from '../motion/hooks/useFaceMotion'

interface FaceStateInput<Look extends MotionLook> {
  /** The looks of the kind of face by state. */
  looks: FaceLooks<Look>
  mood: Mood
  /** Parts of the look of the state to say otherwise, each replacing the one that the state gives. */
  override?: Partial<Look> | undefined
  /** A state to show as it is, in place of the one that the mood gives. */
  state?: FaceState | undefined
  drive?: FaceDrive | undefined
  /** What the look asks of the eyes: what each does by itself, and whether they may blink. */
  eyesOf: (look: Look) => EyesMotion
  /** Where along its rounds the face starts, from 0 up to 1, so that two faces side by side do not move together. */
  phase: number
  /** How much of the extra reach of the eyes the face has room for (see `GazeTiming`); all of it by default. */
  reachShare?: number
  /** How much of every gaze the kind of face takes (see `useGaze`); all of it by default. */
  gazeScale?: number
}

/**
 * The state of a face and everything that moves with it, for any kind of face: the state that it
 * shows for its mood (the mood, or the rest of it, once the blink that covers a change has closed
 * the eyes), the look of that state from the looks of the kind of face, and the motions of the whole
 * face and of its eyes that the look asks for (see `useFaceMotion`). `settle` is for the face to
 * say that its eyes have closed, so that the change of mood goes on. A kind of face draws what this
 * gives it.
 */
export function useFaceState<Look extends MotionLook>({
  looks,
  mood,
  override,
  state,
  drive,
  eyesOf,
  phase,
  reachShare = 1,
  gazeScale = 1,
}: FaceStateInput<Look>) {
  const { shown: given, isChanging, settle } = useFaceMood(mood)
  const shown = state ?? given
  const look: Look = { ...(looks[shown] ?? looks[moodOfState(shown)]), ...override }
  const motion = useFaceMotion(
    look,
    eyesOf(look),
    { phase, isChanging, reachShare, gazeScale },
    drive,
  )
  // A face that has been given another mood is busy again at once, while the eyes are still closing.
  const isRested = shown.startsWith('resting') && !isChanging
  return { state: shown, look, isChanging, settle, isRested, ...motion }
}
