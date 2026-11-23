'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a mark that is drawn: how much of its line is there, from nothing at `from` to all of it at `to` along the round, and all of it after. */
export function useDrawIn(progress: MotionValue<number>, from: number, to: number) {
  return useTransform(progress, (value) => stretchOf(value, from, to))
}
