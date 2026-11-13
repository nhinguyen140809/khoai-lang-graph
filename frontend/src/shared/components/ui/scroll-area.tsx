'use client'

import { cn } from 'cn'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import * as React from 'react'

import { useKeptScroll } from '@/shared/lib/memory'

function ScrollArea({
  className,
  children,
  scrollbars = 'vertical',
  fillContent = false,
  selfScrolling = false,
  keepScroll,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /**
   * A name for the scroll position, which is kept for the page: a page that is left and visited
   * again, such as the page of a tab, shows what the reader was looking at.
   */
  keepScroll?: string
  /**
   * The scrollbars to render. They go outside the viewport: content placed in the viewport, a
   * `ScrollBar` included, scrolls with it.
   */
  scrollbars?: 'vertical' | 'horizontal' | 'both'
  /**
   * Gives the content the height of the area, so that a page that fills its height with `h-full`
   * fills this one, and a page taller than it scrolls the area as usual.
   */
  fillContent?: boolean
  /**
   * Declares that this area is the scroll of a page. An area around the page, such as the one of
   * the tabs, then stays still and leaves the scrolling to this one.
   */
  selfScrolling?: boolean
}) {
  const keptScroll = useKeptScroll(keepScroll ?? '')
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-self-scrolling={selfScrolling ? '' : undefined}
      className={cn('relative', className)}
      {...props}
    >
      {/* The viewport is the containing block of absolutely positioned content, so that it clips
          and scrolls it. Radix wraps the content in a `display: table` element, which grows with
          wide content such as a multi-column layout instead of wrapping it; it is made a block. */}
      <ScrollAreaPrimitive.Viewport
        ref={keepScroll === undefined ? undefined : keptScroll}
        data-slot="scroll-area-viewport"
        className={cn(
          'relative size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 has-data-self-scrolling:overflow-hidden! [&>div]:block!',
          fillContent && '[&>div]:h-full',
        )}
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
