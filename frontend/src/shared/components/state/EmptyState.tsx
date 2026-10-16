import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import type { StateSize } from './state.types'

interface EmptyStateProps {
  /** What is missing, e.g. "No threads yet". */
  title: string
  /** Why it is empty or what to do next. Shown in the `page` size only. */
  description?: string
  /** Shown in the `page` size only. */
  icon?: LucideIcon
  /** The next step, usually a button or a link. */
  action?: ReactNode
  size?: StateSize
  className?: string
}

/** Shown when a query succeeded and returned nothing. */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  size = 'page',
  className,
}: EmptyStateProps) {
  if (size === 'compact') {
    return (
      <div className={cn('flex flex-col items-start gap-1 px-2 py-1', className)}>
        <p className="text-sm text-muted-foreground">{title}</p>
        {action}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-2 p-10 text-center', className)}>
      {Icon && <Icon className="size-8 text-muted-foreground" aria-hidden />}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description !== undefined && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  )
}
