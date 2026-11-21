'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The motion of the lid of a laptop that opens and closes a little about its hinge: where the free end of the lid is. The lid is `length` long and leans `lean` degrees from the base, and swings `swing` degrees to each side. */
export function useSwingLid(
  progress: MotionValue<number>,
  {
    hinge,
    length,
    lean,
    swing,
  }: { hinge: { x: number; y: number }; length: number; lean: number; swing: number },
) {
  const angle = useTransform(
    progress,
    (value) => ((lean + swing * Math.sin(value * Math.PI * 2)) * Math.PI) / 180,
  )
  return {
    x2: useTransform(angle, (value) => hinge.x + length * Math.cos(value)),
    y2: useTransform(angle, (value) => hinge.y - length * Math.sin(value)),
  }
}
