'use client'

import { useEffect, useId } from 'react'

import { useActivityBarStore } from '../activity-bar.store'
import type { ActivityBarItem } from '../destination.types'

/**
 * Shows an item at the bottom of the activity bar while the calling component is mounted, as
 * `useStatusBarItem` does for the status bar: what is on the activity bar of every screen, such as
 * the account menu, registers once instead of passing through every frame. The item takes a new
 * `content` on each render of the caller; keep it in `useMemo`.
 */
export function useActivityBarItem({ order = 0, content }: ActivityBarItem) {
  const source = useId()
  const setItem = useActivityBarStore((state) => state.setItem)
  const removeItem = useActivityBarStore((state) => state.removeItem)

  useEffect(() => {
    setItem(source, { order, content })
  }, [source, order, content, setItem])

  useEffect(
    () => () => {
      removeItem(source)
    },
    [source, removeItem],
  )
}
