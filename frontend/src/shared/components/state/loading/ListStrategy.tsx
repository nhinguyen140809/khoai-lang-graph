import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { addRows, items, spacing } from './loading.utils'

// Two lines of text, and the gap between them: a row is never shorter than that.
const textPx = 36

function Layout({ rows, gap, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      {items(rows).map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton
            className="shrink-0"
            style={{ width: spacing(itemHeight), height: spacing(itemHeight) }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cn('h-4', rowWidths[row % rowWidths.length])} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Rows with a square mark and two lines; the mark sets the height of a row, and extra height adds rows. */
export const listStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 3, itemHeight: 8 }, page: { gap: 4, itemHeight: 10 } },
  fit: addRows((measure) => Math.max(measure.itemHeight * stepPx, textPx)),
  Layout,
}
