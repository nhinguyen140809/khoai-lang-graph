import { Skeleton } from '@/shared/components/ui/skeleton'

import { stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { heightOf, items, spacing, stretchItems } from './loading.utils'

function Layout({ rows, columns, gap, itemHeight }: LayoutProps) {
  return (
    <div
      className="grid w-full"
      style={{
        gap: spacing(gap),
        gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))`,
      }}
    >
      {items(rows * columns).map((index) => (
        <Skeleton key={index} className="rounded-lg" style={heightOf(itemHeight)} />
      ))}
    </div>
  )
}

/** Blocks in columns; extra height keeps the rows and makes every block taller. */
export const gridStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 3, itemHeight: 24 }, page: { gap: 4, itemHeight: 32 } },
  fit: stretchItems((measure, rows) => Math.max(0, rows - 1) * measure.gap * stepPx),
  Layout,
}
