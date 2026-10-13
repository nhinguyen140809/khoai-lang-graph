import { cn } from 'cn'
import type * as React from 'react'

interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** The element: a landmark, such as `main` or `aside`, when the area is one. */
  as?: 'div' | 'main' | 'section' | 'aside'
}

/**
 * A rounded area on the background of the frame, such as the side panel or the editor. It clips
 * its content and does not scroll: content that flows goes in a ScrollArea inside it, and content
 * that fills it, such as a graph, sizes itself with `h-full`.
 */
function Surface({ as: Element = 'div', className, ...props }: SurfaceProps) {
  return (
    <Element
      data-slot="surface"
      className={cn('overflow-hidden rounded-lg border bg-background', className)}
      {...props}
    />
  )
}

export { Surface }
