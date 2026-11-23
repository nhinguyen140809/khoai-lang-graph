'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a zip that is pulled shut: where its pull is, going from `top` to `bottom` between `from` and `to` along the round and staying there, and then going back up at the very end. */
export function useZipDown(
  progress: MotionValue<number>,
  { top, bottom, from, to }: { top: number; bottom: number; from: number; to: number },
) {
  return useTransform(progress, (value) => {
    const down = stretchOf(value, from, to)
    const back = stretchOf(value, 0.9, 1)
    return top + (bottom - top) * down * (1 - back)
  })
}
