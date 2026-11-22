'use client'

import { shapeEyeLines } from '../face.constants'
import type { Mood } from '../face.types'
import { eyeCentersOf } from '../face.utils'
import type { FaceLook } from '../look/face-look.types'
import { faceLooks } from '../mood/face-mood.constants'
import { useFaceMood } from '../mood/hooks/useFaceMood'

/**
 * What a face draws of its mood: the look of the state that it shows (the mood, or the rest of it, once the
 * blink that covers a change has closed the eyes), the centers and the height of the eyes, and what the blink needs to start and end.
 */
export function useFaceParts(look: FaceLook, mood: Mood) {
  const { shown, isChanging, settle } = useFaceMood(mood)
  const moodLook = faceLooks[shown]
  const centers = eyeCentersOf(moodLook.eyes, look.gap, moodLook.eyeScales)
  return { state: shown, moodLook, centers, line: shapeEyeLines[look.shape], isChanging, settle }
}
