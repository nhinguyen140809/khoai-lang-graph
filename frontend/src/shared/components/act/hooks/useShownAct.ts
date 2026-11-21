'use client'

import { animate, type MotionValue, useMotionValue } from 'motion/react'
import { useEffect, useState } from 'react'

import { actFadeMs } from '../act.constants'
import type { ActKey } from '../act.types'

/**
 * The act that is drawn, which follows the act that is wanted in two steps so that a change is
 * smooth: what is around the face goes first (`gain` falls to nothing), then the new act is
 * drawn, and what belongs to it comes in (`gain` rises again). `swaps` counts the changes, so that
 * each act starts its round from the beginning.
 */
export function useShownAct(wanted: ActKey | null): {
  shown: ActKey | null
  swaps: number
  gain: MotionValue<number>
} {
  const [state, setState] = useState({ shown: wanted, swaps: 0 })
  const gain = useMotionValue(1)
  const isChanging = state.shown !== wanted

  useEffect(() => {
    const controls = animate(gain, isChanging ? 0 : 1, {
      duration: (isChanging ? actFadeMs.out : actFadeMs.in) / 1000,
      ease: 'easeOut',
    })
    return () => {
      controls.stop()
    }
  }, [gain, isChanging])

  useEffect(() => {
    if (!isChanging) return
    const timer = setTimeout(() => {
      setState((before) => ({ shown: wanted, swaps: before.swaps + 1 }))
    }, actFadeMs.out)
    return () => {
      clearTimeout(timer)
    }
  }, [isChanging, wanted])

  return { shown: state.shown, swaps: state.swaps, gain }
}
