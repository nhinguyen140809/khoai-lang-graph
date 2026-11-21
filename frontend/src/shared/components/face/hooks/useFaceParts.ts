'use client'

import { shapeEyeLines } from '../face.constants'
import type { FaceState } from '../face.types'
import { eyeCentersOf } from '../face.utils'
import type { FaceLook } from '../look/face-look.types'
import { faceLooks } from '../mood/face-mood.constants'
import { useSettled } from '../mood/hooks/useSettled'

/**
 * What a face draws of its state: the look of the state once the blink that covers a change has
 * closed the eyes, the centers and the height of the eyes, and what the blink needs to start and end.
 */
export function useFaceParts(look: FaceLook, state: FaceState) {
  const { settled, isChanging, settle } = useSettled(state)
  const moodLook = faceLooks[settled]
  const centers = eyeCentersOf(moodLook.eyes, look.gap, moodLook.eyeScales)
  return { moodLook, centers, line: shapeEyeLines[look.shape], isChanging, settle }
}
