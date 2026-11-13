import { Skeleton } from '@/shared/components/ui/skeleton'

import { stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { heightOf, items, spacing, stretchItems } from './loading.utils'

// The title and the row of tags, and above each block its label and the gap to it.
const headerPx = 32 + 20
const labelPx = 16 + 8

function Layout({ rows, gap, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      <Skeleton className="h-8 w-2/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {items(rows).map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-full" style={heightOf(itemHeight)} />
        </div>
      ))}
    </div>
  )
}

/** A title, tags and sections with a label over a block; extra height makes every block taller. */
export const detailStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 4, itemHeight: 16 }, page: { gap: 6, itemHeight: 24 } },
  fit: stretchItems(
    (measure, rows) => headerPx + (1 + rows) * measure.gap * stepPx + rows * labelPx,
  ),
  Layout,
}
