import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { EmptyState } from './EmptyState'
import type { StateSize } from './state.types'

interface NotFoundStateProps {
  /** What does not exist, e.g. "Thread not found". */
  title?: string
  /** What happened and what to do. Shown in the `page` size only. */
  description?: string
  /** What was asked for, such as the address or an item key. Shown in the `page` size only. */
  reference?: string
  /** The way back, usually a link. */
  action?: ReactNode
  size?: StateSize
  className?: string
}

/**
 * Shown when a route or an item does not exist. In the `page` size, the reference is drawn as a
 * trace link that ends at a missing item.
 */
export function NotFoundState({
  title = 'Page not found',
  description = 'No page exists at this address. Check the link and try again.',
  reference,
  action,
  size = 'page',
  className,
}: NotFoundStateProps) {
  if (size === 'compact') {
    return (
      <EmptyState
        size="compact"
        title={title}
        action={action}
        {...(className !== undefined && { className })}
      />
    )
  }

  return (
    <div className={cn('flex flex-col items-start gap-5 p-6', className)}>
      {reference !== undefined && <DanglingLink reference={reference} />}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

// The reference as a node, and a dashed edge (the 6/4 dashes of a dashed Edge) that ends at an
// empty node: the link points to nothing.
function DanglingLink({ reference }: { reference: string }) {
  return (
    <div className="flex w-full max-w-sm items-center text-muted-foreground">
      <span
        title={reference}
        className="max-w-56 truncate rounded-md border bg-card px-2.5 py-1.5 font-mono text-xs text-card-foreground"
      >
        {reference}
      </span>
      <span
        aria-hidden
        className="h-px min-w-10 flex-1 bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_10px)]"
      />
      <ChevronRightIcon aria-hidden className="-ml-1.5 size-3.5 shrink-0" />
      <span
        aria-hidden
        className="h-7 w-14 shrink-0 rounded-md border border-dashed border-muted-foreground/60"
      />
    </div>
  )
}
