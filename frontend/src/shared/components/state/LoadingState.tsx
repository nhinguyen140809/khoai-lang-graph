import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

import { CenteredState } from './CenteredState'
import type { StateSize } from './state.types'

// Fixed widths, cycled per row: random widths would differ between server and client render.
const ROW_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3']

interface LoadingStateProps {
  /** What is loading, announced to screen readers, e.g. "Loading threads". */
  label: string
  /** Number of placeholder rows; match the expected content roughly. */
  rows?: number
  /**
   * Cells of each row, for content that shows as a table: the rows line up as its rows do, at the
   * top of the container, in either size.
   */
  columns?: number | undefined
  size?: StateSize
  className?: string
}

/** Placeholder shown while a query has no data yet. */
export function LoadingState({
  label,
  rows = 3,
  columns,
  size = 'page',
  className,
}: LoadingStateProps) {
  if (columns !== undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={label}
        className={cn('flex w-full flex-col', className)}
      >
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-4 border-b p-2">
            {Array.from({ length: columns }, (_, column) => (
              <div key={column} className="flex-1">
                <Skeleton className={cn('h-4', ROW_WIDTHS[(row + column) % ROW_WIDTHS.length])} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const skeletons = Array.from({ length: rows }, (_, index) => (
    <Skeleton
      key={index}
      className={cn(size === 'compact' ? 'h-4' : 'h-5', ROW_WIDTHS[index % ROW_WIDTHS.length])}
    />
  ))

  if (size === 'compact') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={label}
        className={cn('flex flex-col gap-2 px-2 py-1', className)}
      >
        {skeletons}
      </div>
    )
  }

  return (
    <CenteredState role="status" aria-busy="true" aria-label={label} className={className}>
      <div className="flex w-full max-w-md flex-col gap-3">{skeletons}</div>
    </CenteredState>
  )
}
