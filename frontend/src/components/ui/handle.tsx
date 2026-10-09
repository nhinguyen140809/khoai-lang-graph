import { Handle as FlowHandle } from '@xyflow/react'
import { cn } from 'cn'
import type * as React from 'react'

function Handle({ className, ...props }: React.ComponentProps<typeof FlowHandle>) {
  return (
    <FlowHandle
      data-slot="handle"
      className={cn(
        'size-2.5 rounded-full border border-muted-foreground bg-card transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export { Handle }
