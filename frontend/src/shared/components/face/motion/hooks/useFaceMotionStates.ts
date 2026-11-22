'use client'

import { useMachine } from '@xstate/react'
import { useEffect } from 'react'

import type { Body, EyeLife, MoodLook, Pose } from '../../face.types'
import { canBlink } from '../../face.utils'
import { faceMotionMachine, type FaceMotionValue, type MotionLook } from '../face-motion.reducer'

/** What a mood asks of the motions of a face. */
function motionLookOf({ pose, body, eyes, eyeLives }: MoodLook): MotionLook {
  return {
    pose: pose ?? 'none',
    body: body ?? 'none',
    lives: eyeLives ?? ['steady', 'steady'],
    canBlink: eyes.every(canBlink),
  }
}

/** The state of a motion; its state at no time, before it has gone to its place, is read as the one that the look asks for. */
function settled<State extends string>(state: State | 'start', asked: State): State {
  return state === 'start' ? asked : state
}

/**
 * The state of each motion of a face (see `faceMotionMachine`) for the look of the state that it
 * shows: the pose and the body of the whole face, what each eye does by itself, and whether the eyes
 * are blinking. `isHeld` is that nothing should start, as while a mood changes or when the face is
 * out of sight; `phase` is where along its wait the first blink of the face falls.
 */
export function useFaceMotionStates(
  moodLook: MoodLook,
  { isHeld, phase }: { isHeld: boolean; phase: number },
): { pose: Pose | undefined; body: Body; lives: readonly [EyeLife, EyeLife]; isBlinking: boolean } {
  const look = motionLookOf(moodLook)
  const [snapshot, send] = useMachine(faceMotionMachine, { input: { look, phase } })
  const { pose: askedPose, body, lives, canBlink: isBlinkable } = look
  const [left, right] = lives

  useEffect(() => {
    send({
      type: 'LOOK',
      look: { pose: askedPose, body, lives: [left, right], canBlink: isBlinkable },
    })
  }, [send, askedPose, body, left, right, isBlinkable])

  useEffect(() => {
    send({ type: isHeld ? 'HOLD' : 'RELEASE' })
  }, [send, isHeld])

  const value: FaceMotionValue = snapshot.value
  const shownPose = settled(value.pose, look.pose)
  return {
    pose: shownPose === 'none' ? undefined : shownPose,
    body: settled(value.body, look.body),
    lives: [settled(value.leftEye, look.lives[0]), settled(value.rightEye, look.lives[1])],
    isBlinking: value.blink === 'blinking',
  }
}
