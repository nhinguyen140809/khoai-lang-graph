'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a dot that lights up and dims again over the stretch from `from` to `to` of the round: how bright it is, never dimmer than a third. */
export function useLightUp(progress: MotionValue<number>, from: number, to: number) {
  return useTransform(
    progress,
    (value) => 0.35 + 0.65 * Math.sin(Math.PI * stretchOf(value, from, to)),
  )
}
