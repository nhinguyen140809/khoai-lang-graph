'use client'

import { cn } from 'cn'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />
}

/**
 * The part that opens and closes. It grows to its own height and shrinks back instead of
 * appearing at once; the content stays mounted until the shrinking is done. The motion is
 * dropped when the user asked for less of it.
 */
function CollapsibleContent({
  className,
  duration,
  style,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & {
  /** How long it takes to open and to close, in milliseconds; 200 when left out. */
  duration?: number
}) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none',
        className,
      )}
      style={
        duration === undefined ? style : { animationDuration: `${String(duration)}ms`, ...style }
      }
      {...props}
    />
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
