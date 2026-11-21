import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import type { IconBounds } from './icon.types'
import { fitOf, strokeOf } from './icon.utils'

/**
 * The frame of an icon in the stroke of the lucide icons, as large as the element it is in; the
 * color comes from the text around it. With `bounds`, what the icon draws is scaled and put in the
 * middle so that it takes the same room as the other icons do, and its strokes keep their thickness.
 */
export function IconFrame({
  className,
  stroke,
  bounds,
  children,
}: {
  className?: string | undefined
  /** How thick the strokes are; the default stroke of the icons when none is given. */
  stroke?: number | undefined
  /** What the icon draws, as measured; none for an icon that is drawn to fit already. */
  bounds?: IconBounds | undefined
  children: ReactNode
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeOf(stroke, 1, bounds)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('size-full overflow-visible', className)}
    >
      <g transform={fitOf(bounds)}>{children}</g>
    </svg>
  )
}
