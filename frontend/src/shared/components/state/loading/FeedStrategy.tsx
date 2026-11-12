import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { addRows, items, spacing } from './loading.utils'

// A name line and two lines of text, with the gaps between them and above them.
const textPx = 68

function Layout({ rows, gap, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      {items(rows).map((row) => (
        <div key={row} className="flex gap-3">
          <Skeleton
            className="shrink-0 rounded-full"
            style={{ width: spacing(itemHeight), height: spacing(itemHeight) }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className={cn('h-4', rowWidths[row % rowWidths.length])} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Entries with a round avatar and lines of text; extra height adds entries. */
export const feedStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 4, itemHeight: 8 }, page: { gap: 6, itemHeight: 8 } },
  fit: addRows((measure) => Math.max(measure.itemHeight * stepPx, textPx)),
  Layout,
}
