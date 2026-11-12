import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { addRows, items, spacing } from './loading.utils'

// Padding, border, a title and two lines of text with the gaps between them.
const contentPx = 110

function Layout({ rows, gap, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      {items(rows).map((row) => (
        <div
          key={row}
          className="flex flex-col gap-3 rounded-lg border p-4"
          style={{ minHeight: spacing(itemHeight) }}
        >
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className={cn('h-4', rowWidths[row % rowWidths.length])} />
        </div>
      ))}
    </div>
  )
}

/** Boxes with a title and text; the height asked for is the least of a box, and extra height adds boxes. */
export const cardsStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 3, itemHeight: 20 }, page: { gap: 4, itemHeight: 28 } },
  fit: addRows((measure) => Math.max(measure.itemHeight * stepPx, contentPx)),
  Layout,
}
