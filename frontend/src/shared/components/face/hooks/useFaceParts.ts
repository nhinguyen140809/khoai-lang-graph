'use client'

import { moodLooks } from '../face.constants'
import type { EyeKind, Mood } from '../face.types'
import { eyeCentersOf } from '../face.utils'
import type { EyeShape, FaceLook } from '../face-look.types'
import { useSettled } from './useSettled'

/**
 * What a face draws of its mood: the look of the mood once the blink that covers a change has
 * closed the eyes, the kind and the centers of the eyes, and what the blink needs to start and end.
 */
export function useFaceParts(look: FaceLook, mood: Mood, forcedEyes: EyeShape | undefined) {
  const { settled, isChanging, settle } = useSettled(mood)
  const moodLook = moodLooks[settled]
  const kind: EyeKind = moodLook.eyes ?? forcedEyes ?? look.eyes
  const centers = eyeCentersOf(kind, look.gap, moodLook.eyeScale)
  return { moodLook, kind, centers, isChanging, settle }
}
