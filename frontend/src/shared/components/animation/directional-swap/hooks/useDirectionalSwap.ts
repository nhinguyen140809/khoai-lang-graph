'use client'

import { type ReactNode, useEffect, useState } from 'react'

import type { SlideDirection, SwapMotion, SwapView } from '../directional-swap.types'

/**
 * The content of a swap: the one of the current key, and the old one while it leaves, kept as it
 * was last seen under its key. A change of the key starts the leaving, and it ends after `duration`.
 */
export function useDirectionalSwap({
  swapKey,
  children,
  direction,
  exit,
  duration,
}: {
  swapKey: string | number
  children: ReactNode
  direction: SlideDirection
  exit: SwapMotion
  duration: number
}) {
  const [view, setView] = useState<SwapView>({ key: swapKey, node: children, leaving: null })

  if (view.key !== swapKey) {
    setView({
      key: swapKey,
      node: children,
      leaving: { key: view.key, node: view.node, direction, exit },
    })
  } else if (view.node !== children) {
    // The old content is the last one that its key had: content that arrives late, such as a
    // version that loads, leaves as it was last seen.
    setView({ ...view, node: children })
  }

  const leaving = view.leaving
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => {
      setView((current) => (current.leaving === leaving ? { ...current, leaving: null } : current))
    }, duration)
    return () => {
      clearTimeout(timer)
    }
  }, [leaving, duration])

  return leaving
}
