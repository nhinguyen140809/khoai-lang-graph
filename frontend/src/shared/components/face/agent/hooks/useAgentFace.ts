'use client'

import { useFaceState } from '../../hooks/useFaceState'
import { shapeEyeLines, shapeEyeReachShares } from '../agent-face.constants'
import type { AgentFaceProps } from '../agent-face.types'
import { eyeCentersOf, eyesMotionOf } from '../agent-face.utils'
import { faceLooks } from '../agent-mood.constants'
import type { FaceLook } from '../look/face-look.types'
import { faceOf } from '../look/face-look.utils'
import { useFaceRules } from './useFaceRules'

/**
 * Everything about the face of an agent that does not depend on how it is drawn: its look from the
 * seed, the state it is in (a mood, or the rest that a face of some moods comes to), what the mood
 * does to the eyes, and the motions that every face has (see `useFaceState`), given the eyes of the
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
  const {
    look: moodLook,
    isRested,
    ...face
  } = useFaceState({
    looks: faceLooks,
    mood,
    override,
    state,
    drive,
    eyesOf: eyesMotionOf,
    phase: look.phase,
    reachShare: shapeEyeReachShares[look.shape],
  })
  const parts = {
    state: face.state,
    moodLook,
    centers: eyeCentersOf(moodLook.eyes, look.gap, moodLook.eyeScales),
    line: shapeEyeLines[look.shape],
    isChanging: face.isChanging,
    settle: face.settle,
  }
  return {
    look,
    isRested,
    parts,
    ref: face.ref,
    isInView: face.isInView,
    gaze: face.gaze,
    motions: face.motions,
    poseStyle: face.poseStyle,
    headStyle: face.headStyle,
    bodyStyle: face.bodyStyle,
  }
}
