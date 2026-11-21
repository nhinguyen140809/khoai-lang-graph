'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of marks that all go out at the end of the round (the last 15% of it): how seen they are. */
export function useFadeOutAtEnd(progress: MotionValue<number>) {
  return useTransform(progress, (value) => 1 - stretchOf(value, 0.85, 1))
}
