'use client'

import { animate, type MotionValue, useMotionValue } from 'motion/react'
import { useEffect } from 'react'

import { fadeMs } from '../face-motion.constants'

/**
 * How much of a motion a face takes, from nothing to `target`: it goes to nothing quickly while a
 * mood changes, and back to `target` slowly when the change is over, so that a new motion grows
 * from rest instead of starting at once.
 */
export function useFade(target: number, isChanging: boolean): MotionValue<number> {
  const gain = useMotionValue(target)

  useEffect(() => {
    const controls = animate(gain, isChanging ? 0 : target, {
      duration: (isChanging ? fadeMs.out : fadeMs.in) / 1000,
      ease: 'easeOut',
    })
    return () => {
      controls.stop()
    }
  }, [gain, target, isChanging])

  return gain
}
