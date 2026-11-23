'use client'

import { useMachine } from '@xstate/react'
import { animate, type MotionValue, useMotionValue } from 'motion/react'
import { useEffect, useMemo } from 'react'

import { actFadeMs } from '../act.constants'
import type { ActKey } from '../act.types'
import { drawnActsOf, wantedActOf } from '../act.utils'
import { actCycleMachine } from '../act-cycle.reducer'

/**
 * The act that an actor shows: the acts of a list that are drawn, one after another, each for a few
 * rounds, and again from the first; the list stands still while it is not `isRunning` (out of
 * sight), and starts from its first act when it is another list. A change from one act to the next
 * is smooth: what is around the face goes first (`gain` falls to nothing), then the new act is
 * drawn, and what belongs to it comes in (`gain` rises again). `swaps` counts the changes, so that
 * each act starts its round from the beginning. None is shown when no act of the list is drawn.
 */
export function useActCycle(
  keys: readonly string[],
  isRunning: boolean,
): { shown: ActKey | null; swaps: number; gain: MotionValue<number> } {
  const signature = drawnActsOf(keys).join()
  const drawn = useMemo(
    () => (signature === '' ? [] : (signature.split(',') as ActKey[])),
    [signature],
  )
  const [snapshot, send] = useMachine(actCycleMachine, { input: { drawn, isRunning } })
  const gain = useMotionValue(1)

  useEffect(() => {
    send({ type: 'ACTS', drawn })
  }, [send, drawn])

  useEffect(() => {
    send({ type: isRunning ? 'RUN' : 'PAUSE' })
  }, [send, isRunning])

  const { shown, swaps } = snapshot.context
  const isChanging = wantedActOf(snapshot.context.drawn, snapshot.context.index) !== shown

  useEffect(() => {
    const controls = animate(gain, isChanging ? 0 : 1, {
      duration: (isChanging ? actFadeMs.out : actFadeMs.in) / 1000,
      ease: 'easeOut',
    })
    return () => {
      controls.stop()
    }
  }, [gain, isChanging])

  return { shown, swaps, gain }
}
