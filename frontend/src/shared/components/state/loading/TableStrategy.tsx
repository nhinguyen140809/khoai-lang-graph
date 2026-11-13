import { Skeleton } from '@/shared/components/ui/skeleton'

import { rowWidths, stepPx } from './loading.constants'
import type { LayoutProps, LoadingStrategy } from './loading.types'
import { addRows, heightOf, items } from './loading.utils'

// The padding and the border of a row, around the line of its cells.
const rowPaddingPx = 17

function Layout({ rows, columns, itemHeight }: LayoutProps) {
  return (
    <div className="flex w-full flex-col">
      {items(rows).map((row) => (
        <div key={row} className="flex items-center gap-4 border-b p-2">
          {items(columns).map((column) => (
            <div key={column} className="flex-1">
              <Skeleton
                className={rowWidths[(row + column) % rowWidths.length] ?? ''}
                style={heightOf(itemHeight)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Rows of cells that line up as the rows of a table do; extra height adds rows. */
export const tableStrategy: LoadingStrategy = {
  isFlush: true,
  measures: { compact: { gap: 0, itemHeight: 4 }, page: { gap: 0, itemHeight: 4 } },
  fit: addRows((measure) => measure.itemHeight * stepPx + rowPaddingPx),
  Layout,
}
