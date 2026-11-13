'use client'

import { cn } from 'cn'
import * as ResizablePrimitive from 'react-resizable-panels'

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full aria-[orientation=vertical]:flex-col *:data-animated:transition-[flex-grow] *:data-animated:duration-200 *:data-animated:ease-out motion-reduce:*:data-animated:transition-none',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A panel of the group. While `animated` is set, a change of its size made by a call such as
 * collapse or expand runs over a short time; a size that the user drags always follows the
 * pointer at once, so leave it off then.
 */
function ResizablePanel({
  animated = false,
  ...props
}: ResizablePrimitive.PanelProps & { animated?: boolean }) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      data-animated={animated ? '' : undefined}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        'group relative flex w-1.5 shrink-0 items-center justify-center bg-transparent outline-hidden transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-1.5 after:-translate-x-1/2 hover:bg-primary/40 focus-visible:bg-primary/60 aria-[orientation=horizontal]:h-1.5 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1.5 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 data-[separator=active]:bg-primary/60 [&[aria-orientation=horizontal]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" />}
    </ResizablePrimitive.Separator>
  )
}

export { usePanelRef } from 'react-resizable-panels'
export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
