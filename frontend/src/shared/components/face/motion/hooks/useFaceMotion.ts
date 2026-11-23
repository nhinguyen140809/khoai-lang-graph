'use client'

import { type RefObject, useRef } from 'react'

import { useIsInView } from '@/shared/lib/viewport'

import type { EyesMotion, FaceDrive, GazeTiming, GazeValues, MotionLook } from '../../face.types'
import { gazeLooks } from '../face-motion.constants'
import { useBodyStyles } from './useBodyStyles'
import { useFaceMotionStates } from './useFaceMotionStates'
import { useGaze } from './useGaze'

/**
 * Every motion of a face that does not depend on what the face is drawn of: where it looks over
 * time, what it does as a whole (its pose and its body, with the turns that follow the gaze), and
 * the timing of the blink. It is given the look of the state that the face shows, what its eyes
 * do by themselves, and when it moves (see `GazeTiming`; `isRunning` is not given, since the face
 * out of sight is found here, from the `ref` that this returns for the face to hold). A way of
 * drawing a face takes these and draws them.
 */
export function useFaceMotion(
  moodLook: MotionLook,
  eyes: EyesMotion,
  { phase, isChanging, reachShare }: Omit<GazeTiming, 'isRunning'>,
  drive?: FaceDrive,
) {
  const ref: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const timing: GazeTiming = { phase, isChanging, isRunning: isInView, reachShare }
  const gaze: GazeValues = useGaze(gazeLooks[moodLook.gaze], timing, drive?.look)
  const motions = useFaceMotionStates(moodLook, eyes, { isHeld: isChanging || !isInView, phase })
  const { poseStyle, headStyle, bodyStyle } = useBodyStyles(motions, gaze.head, timing, drive?.move)
  return { ref, isInView, gaze, motions, poseStyle, headStyle, bodyStyle }
}
