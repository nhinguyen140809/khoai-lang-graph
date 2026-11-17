'use client'

import { useMemo } from 'react'

import { useRegisterItem } from '@/shared/lib/registry'

import { useDeskBarStore } from '../desk-bar.store'
import type { DeskBarItem } from '../desk-bar.types'

/**
 * Shows an item in the bar at the top of the desk while the calling component is mounted, so the
 * item leaves with the page that placed it, as an item of the status bar does. The item takes a
 * new `content` on each render of the caller; keep it in `useMemo` when it depends on a few values
 * only.
 */
export function useDeskBarItem({ side, order = 0, content }: DeskBarItem) {
  const item = useMemo(() => ({ side, order, content }), [side, order, content])
  useRegisterItem(useDeskBarStore, item)
}
