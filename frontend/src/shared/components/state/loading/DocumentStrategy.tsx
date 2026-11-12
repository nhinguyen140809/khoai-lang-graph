import { Skeleton } from '@/shared/components/ui/skeleton'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingFit, LoadingMeasure, LoadingStrategy } from './loading.types'
import { heightOf, items, spacing } from './loading.utils'

const headingPx = 32
// Three lines to a paragraph, with the gap between them.
const paragraphPx = (measure: LoadingMeasure) => 3 * measure.itemHeight * stepPx + 2 * 8

function Layout({ rows, gap, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col" style={{ gap: spacing(gap) }}>
      <Skeleton className="h-8 w-1/2" />
      {items(rows).map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <Skeleton className="w-full" style={heightOf(itemHeight)} />
          <Skeleton className="w-full" style={heightOf(itemHeight)} />
          <Skeleton
            className={rowWidths[row % rowWidths.length] ?? ''}
            style={heightOf(itemHeight)}
          />
        </div>
      ))}
    </div>
  )
}

function fit(available: number, measure: LoadingMeasure): LoadingFit {
  const rows = Math.floor((available - headingPx) / (paragraphPx(measure) + measure.gap * stepPx))
  return { rows: Math.max(1, rows), itemHeight: measure.itemHeight }
}

/** A heading over paragraphs of three lines; extra height adds paragraphs. */
export const documentStrategy: LoadingStrategy = {
  isFlush: false,
  measures: { compact: { gap: 3, itemHeight: 4 }, page: { gap: 6, itemHeight: 4 } },
  fit,
  Layout,
}
