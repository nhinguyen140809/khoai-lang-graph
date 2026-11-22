'use client'

import { type MotionValue, useMotionValue } from 'motion/react'
import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import { startVoiceMeter } from '../voice-meter.utils'

/**
 * The level of the voice at the microphone while `isActive`, from 0 (a room, or nobody speaking)
 * to 1, as a value that changes on every frame without rendering again: what moves with the voice
 * reads it through `motion`. `isMetered` says that the level is real; it is false until the
 * microphone is open, when it cannot be opened, and when the user asked for less motion, so that
 * what shows a voice shows something calm instead.
 */
export function useVoiceLevel(isActive: boolean): {
  level: MotionValue<number>
  isMetered: boolean
} {
  const level = useMotionValue(0)
  const [isMetered, setMetered] = useState(false)
  const isReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!isActive || isReducedMotion) return
    let isCancelled = false
    let stopMeter: (() => void) | null = null
    void startVoiceMeter((next) => {
      level.set(next)
    }).then((stop) => {
      if (isCancelled) {
        stop?.()
        return
      }
      stopMeter = stop
      setMetered(stop !== null)
    })
    return () => {
      isCancelled = true
      stopMeter?.()
      setMetered(false)
      level.set(0)
    }
  }, [isActive, isReducedMotion, level])

  return { level, isMetered }
}
