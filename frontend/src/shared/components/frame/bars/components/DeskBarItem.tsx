'use client'

import type { ReactNode } from 'react'

import type { DeskBarSide } from '../desk-bar.types'
import { useDeskBarItem } from '../hooks/useDeskBarItem'

interface DeskBarItemProps {
  side: DeskBarSide
  /** Where the item sits on its side, as `order` of `useDeskBarItem`. */
  order?: number
  /** What the item shows in the bar. */
  children: ReactNode
}

/**
 * Shows its children in the bar at the top of the desk while it is mounted, and renders nothing
 * in place: the layout of a page, a Server Component that cannot call `useDeskBarItem`, places the
 * items of its bar with it.
 * @view user
 */
export function DeskBarItem({ side, order, children }: DeskBarItemProps) {
  useDeskBarItem({ side, order, content: children })
  return null
}
