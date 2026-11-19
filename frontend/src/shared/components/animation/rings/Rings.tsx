import { cn } from 'cn'
import type { ComponentProps, CSSProperties } from 'react'

import {
  defaultRingColors,
  ringsBox,
  ringShapes,
  ringsShapesByVariant,
  ringsSizeClasses,
} from './rings.constants'
import type { RingsColors, RingsVariant } from './rings.types'
import { ringPathOf } from './rings.utils'

interface RingsProps extends Omit<ComponentProps<'span'>, 'color'> {
  variant?: RingsVariant
  size?: keyof typeof ringsSizeClasses
  /** The colors of the first and the second ring, as CSS colors; the primary and the secondary by default. */
  colors?: RingsColors
}

type Ring = 'first' | 'second'

function ringStyleOf(variant: RingsVariant, ring: Ring, color: string): CSSProperties {
  const [first, second, third] = ringsShapesByVariant[variant][ring]
  const radius = ring === 'first' ? ringsBox.firstRadius : ringsBox.secondRadius
  return {
    '--ring-a': ringPathOf(ringShapes[first], radius),
    '--ring-b': ringPathOf(ringShapes[second], radius),
    '--ring-c': ringPathOf(ringShapes[third], radius),
    stroke: color,
  } as CSSProperties
}

/**
 * Two rings, outline only, of almost the same size, so that they cross each other: they turn against
 * each other at different speeds while each goes through three shapes, so the sign that work goes on
 * does not repeat itself at once. The strokes are thick and a little soft at the edge; the second
 * ring lies over the first.
 * With `mixed` the first ring is nearly round and the second ring uneven; with `angular` the rings
 * go through shapes of three-fold symmetry, such as a rounded triangle. For those who ask for less
 * motion it stays a still pair of rings (the animations pause at their first frame, see `styles.css`).
 */
export function Rings({
  variant = 'mixed',
  size = 'default',
  colors = defaultRingColors,
  className,
  ...props
}: RingsProps) {
  const [firstColor, secondColor] = colors
  // Rings that are hidden from assistive technology are a mark beside words, which name the status.
  const status = props['aria-hidden'] ? {} : { role: 'status', 'aria-label': 'Working' }
  return (
    <span
      data-slot="rings"
      className={cn('inline-block shrink-0', ringsSizeClasses[size], className)}
      {...status}
      {...props}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${String(ringsBox.size)} ${String(ringsBox.size)}`}
        fill="none"
        strokeWidth={ringsBox.strokeWidth}
        className="size-full overflow-visible"
      >
        <g className="rings-ring animate-rings-turn-first">
          <path
            className="animate-rings-morph-first rings-path"
            style={ringStyleOf(variant, 'first', firstColor)}
          />
        </g>
        <g className="rings-ring animate-rings-turn-second">
          <path
            className="animate-rings-morph-second rings-path"
            style={ringStyleOf(variant, 'second', secondColor)}
          />
        </g>
      </svg>
    </span>
  )
}
