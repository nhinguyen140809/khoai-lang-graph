import { CircleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { StateSize } from './state.types'

interface ErrorStateProps {
  /** What failed, in words a user understands. */
  message: string
  /** Shows a "Try again" button; pass the query's `refetch` or the error boundary's `reset`. */
  onRetry?: () => void
  size?: StateSize
  className?: string
}

/** Shown when a query or a route failed. */
export function ErrorState({ message, onRetry, size = 'page', className }: ErrorStateProps) {
  if (size === 'compact') {
    return (
      <div role="alert" className={cn('flex flex-col items-start gap-1 px-2 py-1', className)}>
        <p className="text-xs text-destructive">{message}</p>
        {onRetry && (
          <Button variant="link" size="xs" className="h-auto p-0" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 p-6', className)}>
      <CircleAlertIcon className="size-6 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
