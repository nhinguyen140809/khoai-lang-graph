import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { Glow } from './Glow'

type GlowSpec = Omit<ComponentProps<typeof Glow>, 'children'>

// The two glows of each arrangement, so that the pages do not all have the same backdrop: the
// content of the page decides which one fits.
const arrangements = {
  // Behind a narrow column: the start page.
  center: [
    {
      color: 'primary',
      strength: 15,
      size: 'lg',
      className: 'absolute top-1/6 left-1/2 -translate-x-3/4',
    },
    {
      color: 'secondary',
      strength: 20,
      size: 'md',
      entranceDelay: 300,
      motionDelay: -9000,
      className: 'absolute top-1/4 left-1/2 translate-x-1/4',
    },
  ],
  // The same two, on the other sides: the login.
  mirror: [
    {
      color: 'secondary',
      strength: 20,
      size: 'md',
      className: 'absolute top-1/6 left-1/2 -translate-x-3/4',
    },
    {
      color: 'primary',
      strength: 15,
      size: 'lg',
      entranceDelay: 300,
      motionDelay: -9000,
      className: 'absolute top-1/4 left-1/2 translate-x-1/4',
    },
  ],
  // At two opposite corners, large and far apart: a page whose content is wide, such as two cards.
  corners: [
    {
      color: 'primary',
      strength: 15,
      shape: 'ellipse',
      size: 'xl',
      blur: 'xl',
      rotate: -15,
      className: 'absolute top-0 left-0 -translate-x-1/3 -translate-y-1/4',
    },
    {
      color: 'secondary',
      strength: 20,
      shape: 'blob',
      size: 'xl',
      blur: 'xl',
      rotate: 20,
      entranceDelay: 300,
      motionDelay: -11000,
      motionDuration: 22000,
      className: 'absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4',
    },
  ],
} as const satisfies Record<string, readonly GlowSpec[]>

interface GlowBackdropProps {
  /** The arrangement of the two glows; `center` by default. */
  arrangement?: keyof typeof arrangements
  className?: string
}

/**
 * Two soft glows, the primary and the secondary color, behind a page: the page that holds it is
 * `relative isolate` and has a background of its own, which the grain blends with, and the glows stay behind what it shows. They are a backdrop and no more, so
 * keep the text on a card or a field that has a fill of its own. The page that holds it clips what
 * goes past its edge, and the backdrop clips the sides only, so that a glow is not cut off at the
 * foot of a backdrop that has a height. A fine grain lies over the glows, so that a faint color
 * does not show steps. It covers the page; give it a height, with `bottom-auto`,
 * to keep the glows at the top of a page that scrolls.
 */
export function GlowBackdrop({ arrangement = 'center', className }: GlowBackdropProps) {
  return (
    <>
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 -z-10 overflow-x-clip', className)}
      >
        {arrangements[arrangement].map((glow) => (
          <Glow key={glow.color} {...glow} />
        ))}
      </div>
      {/* The grain is a layer of its own beside the glows, not inside them, so that it blends with the
          page under the glows as well and does not tint them. */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 -z-10 noise', className)}
      />
    </>
  )
}
