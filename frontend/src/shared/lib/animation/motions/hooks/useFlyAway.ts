'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a thing that flies off up and to the right, smaller as it goes, and of the trail that it leaves: its place, its scale and how much of the trail is drawn. */
export function useFlyAway(progress: MotionValue<number>) {
  const away = useTransform(progress, (value) => stretchOf(value, 0, 0.7))
  return {
    x: useTransform(away, (value) => value * 3),
    y: useTransform(away, (value) => value * -3),
    scale: useTransform(away, (value) => 1 - value * 0.2),
    trail: useTransform(progress, (value) => stretchOf(value, 0.1, 0.7)),
  }
}
