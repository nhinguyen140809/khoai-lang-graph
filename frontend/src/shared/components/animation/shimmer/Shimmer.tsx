import { cn } from 'cn'
import { Slot } from 'radix-ui'
import type { ComponentProps, CSSProperties } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

interface ShimmerProps extends Omit<ComponentProps<'span'>, 'color'> {
  /** The color of the light that crosses the text, from the colors of the interface; the text's own color, lighter, without one. */
  color?: Tone | undefined
  /** How long the light takes to cross the text once, in milliseconds. */
  duration?: number | undefined
  /** Whether the light moves; off, the text reads as it does without the component. */
  isActive?: boolean | undefined
  /** Puts the light on the element it wraps instead of a span of its own. */
  asChild?: boolean | undefined
}

/**
 * Text that a band of light crosses again and again, to show that what it names is in progress.
 * It is the `shimmer` utility with the options of the interface: a `color` for the light and a
 * `duration`. The light stays still when the user asked for less motion. Where a parent decides
 * when the light moves, as the state of a line of a trace does, use the `shimmer` utility with a
 * variant of the parent instead.
 */
function Shimmer({
  color,
  duration,
  isActive = true,
  asChild = false,
  className,
  style,
  ...props
}: ShimmerProps) {
  const Comp = asChild ? Slot.Root : 'span'
  return (
    <Comp
      data-slot="shimmer"
      data-active={isActive}
      className={cn(
        'shimmer motion-reduce:shimmer-none',
        color !== undefined && ['shimmer-tone', toneClasses[color]],
        !isActive && 'shimmer-none',
        className,
      )}
      style={
        duration === undefined
          ? style
          : ({ '--shimmer-duration': `${String(duration)}ms`, ...style } as CSSProperties)
      }
      {...props}
    />
  )
}

export { Shimmer }
