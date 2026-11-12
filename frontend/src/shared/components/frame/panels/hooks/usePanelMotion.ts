'use client'

import { useEffect, useEffectEvent, useState } from 'react'

import type { usePanelRef } from '@/shared/components/ui/resizable'
import { motionMs } from '@/shared/lib/animation'

import { panelSettleMs } from '../panel.constants'
import type { usePanel } from './usePanel'

/**
 * The motion of a panel that grows to its stored size when it is shown and shrinks to nothing when
 * it is hidden. `isAnimating` holds while it moves, when the sizes in between are not the size the
 * user chose; `isShrunk` holds once it has shrunk to nothing, so that what it holds can be hidden.
 */
export function usePanelMotion(
  panel: ReturnType<typeof usePanel>,
  panelRef: ReturnType<typeof usePanelRef>,
) {
  const [wasVisible, setWasVisible] = useState(panel.visible)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isShrunk, setIsShrunk] = useState(!panel.visible)

  if (panel.visible !== wasVisible) {
    setWasVisible(panel.visible)
    setIsAnimating(true)
    if (panel.visible) setIsShrunk(false)
  }

  // What the run does to the panel reads the latest panel, and does not start another run.
  const run = useEffectEvent(() => {
    if (panel.visible) {
      panelRef.current?.expand()
      panelRef.current?.resize(panel.storedSize())
    } else {
      panelRef.current?.collapse()
    }
  })
  const isVisible = panel.visible

  useEffect(() => {
    if (!isAnimating) return
    run()
    const timer = setTimeout(() => {
      setIsAnimating(false)
      if (!isVisible) setIsShrunk(true)
    }, motionMs + panelSettleMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isAnimating, isVisible])

  return { isAnimating, isShrunk }
}
