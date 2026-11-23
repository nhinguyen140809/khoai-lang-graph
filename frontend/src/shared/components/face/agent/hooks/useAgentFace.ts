'use client'

import { useFaceMotion } from '../../motion/hooks/useFaceMotion'
import { shapeEyeReachShares } from '../agent-face.constants'
import type { AgentFaceProps } from '../agent-face.types'
import { canBlink } from '../agent-face.utils'
import type { FaceLook } from '../look/face-look.types'
import { faceOf } from '../look/face-look.utils'
import { useFaceParts } from './useFaceParts'
import { useFaceRules } from './useFaceRules'

/**
 * Everything about the face of an agent that does not depend on how it is drawn: its look from the
 * seed, the state it is in (a mood, or the rest that a face of some moods comes to), what the mood
 * does to the eyes, and the motions that every face has (see `useFaceMotion`), given the eyes of the
 * agent and the room that its outline has for them. Each way of drawing the face takes these and
 * draws them, so that a face means the same thing however it is drawn.
 */
export function useAgentFace({
  seed,
  mood = 'idle',
  drive,
  override,
  state,
}: Pick<AgentFaceProps, 'seed' | 'mood' | 'drive' | 'override' | 'state'>) {
  const look: FaceLook = faceOf(seed, useFaceRules())
  const parts = useFaceParts(look, mood, override, state)
  const { moodLook } = parts
  const motion = useFaceMotion(
    moodLook,
    { lives: moodLook.eyeLives ?? ['steady', 'steady'], canBlink: moodLook.eyes.every(canBlink) },
    {
      phase: look.phase,
      isChanging: parts.isChanging,
      reachShare: shapeEyeReachShares[look.shape],
    },
    drive,
  )
  // A face that has been given another mood is busy again at once, while the eyes are still closing.
  const isRested = parts.state.startsWith('resting') && !parts.isChanging
  return { look, isRested, parts, ...motion }
}
