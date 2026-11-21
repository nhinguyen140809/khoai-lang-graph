'use client'

import { useEffect, useMemo, useState } from 'react'

import { actDwellRounds } from '../act.constants'
import type { ActKey } from '../act.types'
import { actOf, drawnActsOf } from '../act.utils'

/**
 * The act that a list of acts is at: the acts that are drawn, one after another, each for a few
 * rounds, and again from the first. The list stands still while it is not `isRunning` (out of
 * sight), and starts from its first act when it is another list. None when no act of it is drawn.
 */
export function useActSequence(keys: readonly string[], isRunning: boolean): ActKey | null {
  const signature = drawnActsOf(keys).join()
  const drawn = useMemo(
    () => (signature === '' ? [] : (signature.split(',') as ActKey[])),
    [signature],
  )
  const [turn, setTurn] = useState({ signature, index: 0 })
  const index = turn.signature === signature ? turn.index : 0
  const key = drawn.length === 0 ? null : (drawn[index % drawn.length] ?? null)
  const dwellMs = (actOf(key)?.loopMs ?? 0) * actDwellRounds

  useEffect(() => {
    if (!isRunning || drawn.length < 2) return
    const timer = setTimeout(() => {
      setTurn({ signature, index: index + 1 })
    }, dwellMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isRunning, drawn.length, dwellMs, signature, index])

  return key
}
