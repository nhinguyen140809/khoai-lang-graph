import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

import type { StateSize } from './state.types'

// Fixed widths, cycled per row: random widths would differ between server and client render.
const ROW_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3']

interface LoadingStateProps {
  /** What is loading, announced to screen readers, e.g. "Loading threads". */
  label: string
  /** Number of placeholder rows; match the expected content roughly. */
  rows?: number
  size?: StateSize
  className?: string
}

/** Placeholder shown while a query has no data yet. */
export function LoadingState({ label, rows = 3, size = 'page', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn(
        'flex flex-col',
        size === 'compact' ? 'gap-2 px-2 py-1' : 'gap-3 p-6',
        className,
      )}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(size === 'compact' ? 'h-4' : 'h-5', ROW_WIDTHS[index % ROW_WIDTHS.length])}
        />
      ))}
    </div>
  )
}
