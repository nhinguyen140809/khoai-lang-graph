import type { CSSProperties } from 'react'

import { swapDirections, swapPhaseSigns } from './directional-swap.config'
import type { SlideDirection } from './directional-swap.types'

/**
 * The style of content that slides while it fades. The distance is a share of the size of the
 * content itself, its width for left and right and its height for up and down, so that a slide
 * reads the same on a small item and on a wide one. New content starts that far on the side the
 * move comes from; old content ends that far on the side it goes to. `ms` is how long it takes.
 */
export function slideStyle(
  direction: SlideDirection,
  phase: 'enter' | 'exit',
  { distance, ms, slides }: { distance: number; ms: number; slides: boolean },
): CSSProperties {
  const style: Record<string, string> = {
    animationDuration: `${String(ms)}ms`,
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
  if (!slides) return style
  const { axis, heading } = swapDirections[direction]
  const sign = heading * swapPhaseSigns[phase]
  style[`--tw-${phase}-translate-${axis}`] = `${String(sign * distance * 100)}%`
  return style
}
