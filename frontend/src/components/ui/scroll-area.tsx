'use client'

import { cn } from 'cn'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import * as React from 'react'

function ScrollArea({
  className,
  children,
  scrollbars = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /**
   * The scrollbars to render. They go outside the viewport: content placed in the viewport, a
   * `ScrollBar` included, scrolls with it.
   */
  scrollbars?: 'vertical' | 'horizontal' | 'both'
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      {/* The viewport is the containing block of absolutely positioned content, so that it clips
          and scrolls it. Radix wraps the content in a `display: table` element, which grows with
          wide content such as a multi-column layout instead of wrapping it; it is made a block. */}
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="relative size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 [&>div]:block!"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {scrollbars !== 'horizontal' && <ScrollBar />}
      {scrollbars !== 'vertical' && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
