'use client'

import { useMemo } from 'react'

import { useRegisterItem } from '@/shared/lib/registry'

import { useActivityBarStore } from '../activity-bar.store'
import type { ActivityBarItem } from '../destination.types'

/**
 * Shows an item at the bottom of the activity bar while the calling component is mounted, as
 * `useStatusBarItem` does for the status bar: what is on the activity bar of every screen, such as
 * the account menu, registers once instead of passing through every frame. The item takes a new
 * `content` on each render of the caller; keep it in `useMemo`.
 */
export function useActivityBarItem({ order = 0, content }: ActivityBarItem) {
  const item = useMemo(() => ({ order, content }), [order, content])
  useRegisterItem(useActivityBarStore, item)
}
