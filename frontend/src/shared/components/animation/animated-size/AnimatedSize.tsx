'use client'

import { cn } from 'cn'
import type * as React from 'react'

import { motionMs, useElementSize } from '@/shared/lib/animation'

interface AnimatedSizeProps extends Omit<React.ComponentProps<'div'>, 'style'> {
  /**
   * The classes of the box that holds the children, which sets the width they take, such as `w-80`
   * or `max-w-xs` for text that wraps; they take the width of their content when left out. The
   * box does not take a width from its own box, which is the size it follows.
   */
  contentClassName?: string | undefined
  /** How long the box takes to move to a new size, in milliseconds. */
  duration?: number
}

/**
 * A box that grows and shrinks to what it holds instead of jumping, whatever changes the size
 * of its children: another layout, content that loads, a longer text. It follows the size of the
 * children and moves its own width and height to it, so the change runs over a short time. A
 * length that is `auto` cannot be animated, which is why the size is a measured number. It
 * clips what overflows while it moves, and it takes its size from the children at once on the
 * first render and when the user asked for less motion.
 */
function AnimatedSize({
  className,
  contentClassName,
  duration = motionMs,
  children,
  ...props
}: AnimatedSizeProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()

  return (
    <div
      data-slot="animated-size"
      style={{
        transitionDuration: `${String(duration)}ms`,
        ...(size && { width: size.width, height: size.height }),
      }}
      className={cn(
        'max-w-full overflow-hidden transition-size motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <div ref={ref} className={cn('w-max', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export { AnimatedSize }
