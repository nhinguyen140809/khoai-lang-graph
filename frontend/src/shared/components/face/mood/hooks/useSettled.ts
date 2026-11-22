'use client'

import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import { swapFallbackMs } from '../face-mood.constants'

/**
 * A value that changes in two steps, so that a change can be covered: the new value is `pending`
 * from the start, and is `settled` when `settle` is called, which the part that covers the change
 * does once it is done, or after a time if it never does. A user who asked for less motion has the
 * value at once, with nothing to cover.
 */
export function useSettled<Value>(value: Value): {
  settled: Value
  isChanging: boolean
  settle: () => void
} {
  const [settled, setSettled] = useState(value)
  const isStill = usePrefersReducedMotion()
  const isChanging = value !== settled && !isStill

  if (isStill && value !== settled) setSettled(value)

  const settle = () => {
    setSettled(value)
  }

  useEffect(() => {
    if (!isChanging) return
    const timer = setTimeout(() => {
      setSettled(value)
    }, swapFallbackMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isChanging, value])

  return { settled, isChanging, settle }
}
