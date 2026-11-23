'use client'

import { type MotionStyle, type MotionValue, useMotionValue, useTransform } from 'motion/react'

import type { Body, FaceDrive, GazeTiming, GazeValues, Pose } from '../../face.types'
import { bodyLoops, poseLoops } from '../face-loop.constants'
import { useLoop } from './useLoop'

/** The sum of two values that change over time. */
function useSum(first: MotionValue<number>, second: MotionValue<number>): MotionValue<number> {
  return useTransform<number, number>([first, second], ([a, b]) => (a ?? 0) + (b ?? 0))
}

/** A value that is a share of the size of the element, as a percentage. */
function usePercent(share: MotionValue<number>): MotionValue<string> {
  return useTransform(share, (value) => `${String(value * 100)}%`)
}

/**
 * What moves the whole face by its mood, as the styles of the two elements that carry it: the pose
 * (the plane of the page, pivoting on the bottom) and the body (the face as a whole, about the middle
 * of its depth, which also turns with the eyes: the turns of the gaze add to those of the body). A
 * `move` from outside is added to the body: its offsets and turn to those of the mood, its scale
 * times that of the mood.
 */
export function useFaceMotion(
  { pose, body }: { pose?: Pose | undefined; body?: Body | undefined },
  head: GazeValues['head'],
  { phase, isChanging, isRunning }: GazeTiming,
  move?: FaceDrive['move'],
): { poseStyle: MotionStyle; bodyStyle: MotionStyle } {
  const posed = useLoop(pose === undefined ? null : poseLoops[pose], phase, isChanging, isRunning)
  const bodied = useLoop(bodyLoops[body ?? 'none'], phase, isChanging, isRunning)
  const rotateX = useSum(head.rotateX, bodied.rotateX)
  const rotateY = useSum(head.rotateY, bodied.rotateY)
  const none = useMotionValue(0)
  const whole = useMotionValue(1)
  const x = usePercent(useSum(bodied.x, move?.x ?? none))
  const y = usePercent(useSum(bodied.y, move?.y ?? none))
  const rotate = useSum(bodied.rotate, move?.rotate ?? none)
  const scale = useTransform<number, number>(
    [bodied.scale, move?.scale ?? whole],
    ([a, b]) => (a ?? 1) * (b ?? 1),
  )

  return {
    poseStyle: { rotate: posed.rotate, scale: posed.scale, originY: 1 },
    bodyStyle: {
      x,
      y,
      rotate,
      rotateX,
      rotateY,
      rotateZ: head.rotateZ,
      scale,
      scaleX: bodied.scaleX,
      scaleY: bodied.scaleY,
    },
  }
}
