import { cn } from 'cn'
import type * as React from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

import { Surface } from './surface'

/**
 * Where in the containing area the surface floats: at a corner, or in the middle of the top or
 * the bottom edge.
 */
type FloatingPlacement =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** How far the surface sits from the edges of its placement. */
type FloatingOffset = 'none' | 'sm' | 'default' | 'lg'

/** The background of the surface: the page, a popover, or a blur of what floats under it. */
type FloatingVariant = 'default' | 'popover' | 'glass'

/** The padding inside the surface; `none` leaves the padding to what the surface holds. */
type FloatingSize = 'none' | 'sm' | 'default' | 'lg'

// Tailwind cannot see classes put together at run time, so every placement at every offset is
// written out: the columns are the spacing scale, and only the edges of the placement are set. A
// middle sits at the center of its edge, whatever its width.
const placementStyles: Record<FloatingOffset, Record<FloatingPlacement, string>> = {
  none: {
    'top-left': 'left-0 top-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'top-right': 'right-0 top-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0',
  },
  sm: {
    'top-left': 'left-2 top-2',
    'top-center': 'top-2 left-1/2 -translate-x-1/2',
    'top-right': 'right-2 top-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-center': 'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-2 right-2',
  },
  default: {
    'top-left': 'left-4 top-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'right-4 top-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  },
  lg: {
    'top-left': 'left-6 top-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'top-right': 'right-6 top-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-6 right-6',
  },
}

const variantStyles: Record<FloatingVariant, string> = {
  default: 'bg-background',
  popover: 'bg-popover text-popover-foreground',
  glass:
    'bg-background/80 supports-backdrop-filter:bg-background/60 supports-backdrop-filter:backdrop-blur',
}

const sizeStyles: Record<FloatingSize, string> = {
  none: 'p-0',
  sm: 'p-2',
  default: 'p-3',
  lg: 'p-4',
}

// The width the surface never grows past, so that it fits the area at its own inset.
const maxWidthStyles: Record<FloatingOffset, string> = {
  none: 'max-w-full',
  sm: 'max-w-[calc(100%-1rem)]',
  default: 'max-w-[calc(100%-2rem)]',
  lg: 'max-w-[calc(100%-3rem)]',
}

interface FloatingSurfaceProps extends Omit<
  React.ComponentProps<typeof Surface>,
  'className' | 'color'
> {
  /** Where in the containing area the surface floats; the bottom-right corner when left out. */
  placement?: FloatingPlacement
  /** How far the surface sits from the edges of its place; the fourth of the scale when left out. */
  offset?: FloatingOffset
  /** The background of the surface: the page, a popover, or a blur of what floats under it. */
  variant?: FloatingVariant
  /** The padding inside the surface; the third of the scale when left out. */
  size?: FloatingSize
  /**
   * The meaning of the surface, from the colors of the interface: its border and a tint of its
   * background take the color. It has no color, and a neutral border, when left out.
   */
  color?: Tone | undefined
  className?: string | undefined
}

/**
 * A surface that floats at a corner, or in the middle of the top or bottom edge, of the area that
 * contains it, above the content of that area: it stays where it is while the content scrolls, and
 * it is clipped to the area, so it never covers the rest of the app. It also keeps to the width of
 * the area less its inset, so nothing of it is clipped on a narrow window. The nearest positioned
 * ancestor places it: give the area `relative`. The surface sizes itself to what it holds;
 * anything else, such as its z-index or a wider shape, changes through `className`.
 */
function FloatingSurface({
  placement = 'bottom-right',
  offset = 'default',
  variant = 'default',
  size = 'default',
  color,
  as = 'div',
  className,
  ...props
}: FloatingSurfaceProps) {
  return (
    <Surface
      as={as}
      data-slot="floating-surface"
      className={cn(
        'absolute z-20 w-fit shrink-0 shadow-lg',
        placementStyles[offset][placement],
        maxWidthStyles[offset],
        variantStyles[variant],
        sizeStyles[size],
        color !== undefined && [
          toneClasses[color],
          // The border and a tint of the color of the surface, which the --tone variables give.
          'border-(--tone-border) bg-linear-to-b from-(--tone-soft) to-(--tone-soft)',
        ],
        className,
      )}
      {...props}
    />
  )
}

export {
  type FloatingOffset,
  type FloatingPlacement,
  type FloatingSize,
  FloatingSurface,
  type FloatingVariant,
}
