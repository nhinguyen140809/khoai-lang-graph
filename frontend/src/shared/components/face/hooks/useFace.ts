'use client'

import { type RefObject, useRef } from 'react'

import { useIsInView } from '@/shared/lib/viewport'

import { shapeEyeReachShares } from '../face.constants'
import type { FaceProps, GazeValues } from '../face.types'
import type { FaceLook } from '../look/face-look.types'
import { faceOf } from '../look/face-look.utils'
import { gazeLooks } from '../motion/face-motion.constants'
import { useFaceMotion } from '../motion/hooks/useFaceMotion'
import { useGaze } from '../motion/hooks/useGaze'
import { useFaceParts } from './useFaceParts'
import { useFaceRules } from './useFaceRules'

/**
 * Everything about a face that does not depend on how it is drawn: its look from the seed, the
 * state it is in (a mood, or the rest that a face of some moods comes to), what the mood does to
 * the eyes, where the eyes look over time and how the whole face moves. Each way of drawing a face
 * takes these and draws them, so that a face means the same thing however it is drawn.
 */
export function useFace({
  seed,
  mood = 'idle',
  drive,
}: Pick<FaceProps, 'seed' | 'mood' | 'drive'>) {
  const look: FaceLook = faceOf(seed, useFaceRules())
  const ref: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const parts = useFaceParts(look, mood)
  // A face that has been given another mood is busy again at once, while the eyes are still closing.
  const isRested = parts.state.startsWith('resting') && !parts.isChanging
  const timing = {
    phase: look.phase,
    isChanging: parts.isChanging,
    isRunning: isInView,
    reachShare: shapeEyeReachShares[look.shape],
  }
  const gaze: GazeValues = useGaze(gazeLooks[parts.moodLook.gaze], timing, drive?.look)
  const { poseStyle, bodyStyle } = useFaceMotion(parts.moodLook, gaze.head, timing, drive?.move)
  return { look, ref, isInView, isRested, parts, gaze, poseStyle, bodyStyle }
}
