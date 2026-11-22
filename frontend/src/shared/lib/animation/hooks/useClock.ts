'use client'

import { animate, type AnimationPlaybackControls, type MotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'

/**
 * Runs a clock, a value that goes round from `start` to `start + 1` over `durationMs` and starts
 * again (or goes back the way it came, when `isMirrored`), while `isRunning`. When it is not
 * running the clock is held where it is and goes on from there, so that a face out of sight costs
 * nothing and does not jump when it comes back. No clock runs when `durationMs` is null.
 */
export function useClock(
  clock: MotionValue<number>,
  {
    durationMs,
    start,
    isMirrored,
  }: { durationMs: number | null; start: number; isMirrored: boolean },
  isRunning: boolean,
) {
  const controlsRef = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    if (durationMs === null) return
    const controls = animate(clock, [start, start + 1], {
      duration: durationMs / 1000,
      ease: 'linear',
      repeat: Infinity,
      repeatType: isMirrored ? 'mirror' : 'loop',
    })
    controlsRef.current = controls
    return () => {
      controls.stop()
      controlsRef.current = null
    }
  }, [clock, durationMs, start, isMirrored])

  useEffect(() => {
    if (isRunning) controlsRef.current?.play()
    else controlsRef.current?.pause()
  }, [isRunning, clock, durationMs, start, isMirrored])
}
