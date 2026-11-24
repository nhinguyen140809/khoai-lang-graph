'use client'

import { type MotionValue, useMotionValue, useTransform } from 'motion/react'

import type { Body, FaceDrive, FaceStyles, GazeTiming, GazeValues, Pose } from '../../face.types'
import { bodyLoops, poseLoops } from '../face-loop.constants'
import { useLoop } from './useLoop'
import { useSum } from './useSum'

/** A value that is a share of the size of the element, as a percentage. */
function usePercent(share: MotionValue<number>): MotionValue<string> {
  return useTransform(share, (value) => `${String(value * 100)}%`)
}

/**
 * What moves a face by its mood, as three styles, each for an element of its own, so that a kind of
 * face puts each where it has the part that it moves:
 *
 * - `poseStyle`, the pose: the plane of the page, pivoting on the bottom (the neck, for a face of a
 *   person).
 * - `headStyle`, the turns of the head with the eyes, which come from the gaze.
 * - `bodyStyle`, the body: the whole, about the middle of its depth. A `move` from outside is added
 *   to it: its offsets and turn to those of the mood, its scale times that of the mood.
 *
 * A face that has no head apart from its body puts the head on the body (see `useTurnedBody`).
 */
export function useFaceStyles(
  { pose, body }: { pose?: Pose | undefined; body?: Body | undefined },
  head: GazeValues['head'],
  { phase, isChanging, isRunning }: GazeTiming,
  move?: FaceDrive['move'],
): FaceStyles {
  const posed = useLoop(pose === undefined ? null : poseLoops[pose], phase, isChanging, isRunning)
  const bodied = useLoop(bodyLoops[body ?? 'none'], phase, isChanging, isRunning)
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
    headStyle: head,
    bodyStyle: {
      x,
      y,
      rotate,
      rotateX: bodied.rotateX,
      rotateY: bodied.rotateY,
      scale,
      scaleX: bodied.scaleX,
      scaleY: bodied.scaleY,
    },
  }
}
