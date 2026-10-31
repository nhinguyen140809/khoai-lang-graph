import { cn } from 'cn'
import type * as React from 'react'

import { Surface } from './surface'

/** Which corner of the containing area the surface floats in. */
type FloatingCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** How far the surface sits from the edges of its corner. */
type FloatingOffset = 'none' | 'sm' | 'default' | 'lg'

/** The background of the surface: the page, a popover, or a blur of what floats under it. */
type FloatingVariant = 'default' | 'popover' | 'glass'

/** The padding inside the surface. */
type FloatingSize = 'sm' | 'default' | 'lg'

// Tailwind cannot see classes put together at run time, so every corner at every offset is
// written out: the columns are the spacing scale, and only the two edges of the corner are set.
const cornerStyles: Record<FloatingOffset, Record<FloatingCorner, string>> = {
  none: {
    'top-left': 'left-0 top-0',
    'top-right': 'right-0 top-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  },
  sm: {
    'top-left': 'left-2 top-2',
    'top-right': 'right-2 top-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  },
  default: {
    'top-left': 'left-4 top-4',
    'top-right': 'right-4 top-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  },
  lg: {
    'top-left': 'left-6 top-6',
    'top-right': 'right-6 top-6',
    'bottom-left': 'bottom-6 left-6',
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
  sm: 'p-2',
  default: 'p-3',
  lg: 'p-4',
}

interface FloatingSurfaceProps extends Omit<React.ComponentProps<typeof Surface>, 'className'> {
  /** Which corner of the containing area the surface floats in; bottom-right when left out. */
  corner?: FloatingCorner
  /** How far the surface sits from the edges of its corner; the fourth of the scale when left out. */
  offset?: FloatingOffset
  /** The background of the surface: the page, a popover, or a blur of what floats under it. */
  variant?: FloatingVariant
  /** The padding inside the surface; the third of the scale when left out. */
  size?: FloatingSize
  className?: string | undefined
}

/**
 * A surface that floats at a corner of the area that contains it, above the content of that
 * area: it stays where it is while the content scrolls, and it is clipped to the area, so it
 * never covers the rest of the app. The nearest positioned ancestor places it: give the area
 * `relative`. The surface sizes itself to what it holds; anything else, such as its z-index
 * or a wider shape, changes through `className`.
 */
function FloatingSurface({
  corner = 'bottom-right',
  offset = 'default',
  variant = 'default',
  size = 'default',
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
        cornerStyles[offset][corner],
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
}

export {
  type FloatingCorner,
  type FloatingOffset,
  type FloatingSize,
  FloatingSurface,
  type FloatingVariant,
}
