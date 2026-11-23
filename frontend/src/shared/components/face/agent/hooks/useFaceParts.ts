'use client'

import type { FaceState, Mood } from '../../face.types'
import { useFaceMood } from '../../mood/hooks/useFaceMood'
import { shapeEyeLines } from '../agent-face.constants'
import type { MoodOverride } from '../agent-face.types'
import { eyeCentersOf } from '../agent-face.utils'
import { faceLooks } from '../agent-mood.constants'
import type { FaceLook } from '../look/face-look.types'

/**
 * What a face draws of its mood: the look of the state that it shows (the mood, or the rest of it, once the
 * blink that covers a change has closed the eyes), the centers and the height of the eyes, and what the blink needs to start and end.
 */
export function useFaceParts(
  look: FaceLook,
  mood: Mood,
  override?: MoodOverride,
  state?: FaceState,
) {
  const { shown: given, isChanging, settle } = useFaceMood(mood)
  const shown = state ?? given
  const moodLook = { ...faceLooks[shown], ...override }
  const centers = eyeCentersOf(moodLook.eyes, look.gap, moodLook.eyeScales)
  return { state: shown, moodLook, centers, line: shapeEyeLines[look.shape], isChanging, settle }
}
