import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { addRows, heightOf, items, spacing } from './loading.utils'

function Layout({ rows, gap, itemHeight, alternate }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      {items(rows).map((row) => (
        <Skeleton
          key={row}
          className={cn(
            rowWidths[row % rowWidths.length],
            alternate && (row % 2 === 0 ? 'self-start' : 'self-end'),
            alternate && 'rounded-2xl',
          )}
          style={heightOf(itemHeight)}
        />
      ))}
    </div>
  )
}

/** Text rows, one line each, in a few widths; extra height adds rows. */
export const linesStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 2, itemHeight: 4 }, page: { gap: 3, itemHeight: 5 } },
  fit: addRows((measure) => measure.itemHeight * stepPx),
  Layout,
}
