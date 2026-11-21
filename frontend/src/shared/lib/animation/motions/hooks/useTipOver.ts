'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a book that stands, tips over to lean against others, and stands up again: how far it leans, in degrees, up to `lean`. It speeds up as it falls, as a thing that falls does. */
export function useTipOver(progress: MotionValue<number>, lean: number) {
  return useTransform(progress, (value) => {
    const fall = stretchOf(value, 0.15, 0.45)
    const rise = stretchOf(value, 0.8, 1)
    return lean * fall * fall * (1 - rise * rise)
  })
}
