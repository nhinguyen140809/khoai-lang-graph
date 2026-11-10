'use client'

import { cn } from 'cn'
import type * as React from 'react'

import { useElementSize } from '@/shared/lib/animation'

interface AnimatedSizeProps extends Omit<React.ComponentProps<'div'>, 'style'> {
  /** The classes of the box that holds the children, which sets the width they take, such as `w-80`; they take the width of their content when left out. */
  contentClassName?: string | undefined
}

/**
 * A box that grows and shrinks to what it holds instead of jumping, whatever changes the size
 * of its children: another layout, content that loads, a longer text. It follows the size of the
 * children and moves its own width and height to it, so the change runs over a short time. A
 * length that is `auto` cannot be animated, which is why the size is a measured number. It
 * clips what overflows while it moves, and it takes its size from the children at once on the
 * first render and when the user asked for less motion.
 */
function AnimatedSize({ className, contentClassName, children, ...props }: AnimatedSizeProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()

  return (
    <div
      data-slot="animated-size"
      style={size ? { width: size.width, height: size.height } : undefined}
      className={cn(
        'max-w-full overflow-hidden transition-[width,height] duration-200 ease-out motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <div ref={ref} className={cn('w-max max-w-full', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export { AnimatedSize }
