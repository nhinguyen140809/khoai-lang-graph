'use client'

import { useElementSize } from '@/shared/lib/animation'

import { defaultColumns, flushPadding, sizePadding } from './loading/loading.constants'
import { loadingContainers } from './loading/loading-containers.config'
import { resolveLoading } from './loading/loading-resolve.utils'
import { loadingStrategies } from './loading/loading-strategies.config'
import type { LoadingLayout, StateSize } from './state.types'

interface LoadingStateProps {
  /** What is loading, announced to screen readers, e.g. "Loading threads". */
  label: string
  /** Number of placeholder rows (rows of blocks in a `grid`, paragraphs in a `document`). */
  rows?: number
  /**
   * Cells of each row, for content that shows as a table: the rows line up as its rows do, at the
   * top of the container, in either size. Without a `layout`, it picks the `table` layout; a
   * `grid` reads it as its number of columns.
   */
  columns?: number | undefined
  /** The shape that matches the content; `lines` unless `columns` is set. */
  layout?: LoadingLayout | undefined
  /** The gap between items, in steps of the spacing scale (4 is 1rem); the layout has its own. */
  gap?: number | undefined
  /** The height of an item, in steps of the spacing scale; its meaning depends on the layout. */
  itemHeight?: number | undefined
  /**
   * Fills the height of the container instead of the number of rows asked for. Each layout takes
   * the extra height its own way: more rows, more paragraphs, or taller blocks. On by default for
   * a layout named in the `page` size, and it needs a container that has a height.
   */
  fill?: boolean | undefined
  /**
   * `full` takes the whole width of the container; `narrow` keeps a column of a readable width in
   * the middle of it. `narrow` for `lines` named by no layout in the `page` size, as it always was,
   * and `full` for the rest.
   */
  width?: 'full' | 'narrow' | undefined
  /** In `lines`, rows take turns at the start and at the end, as the lines of a conversation do. */
  alternate?: boolean | undefined
  size?: StateSize
  className?: string
}

/**
 * Placeholder shown while a query has no data yet. A named layout takes the whole width of its
 * container and starts at the top, as the content it stands in for does; without one, `lines` in
 * the `page` size keeps a narrow column in the middle of the container.
 */
export function LoadingState({
  label,
  rows = 3,
  columns,
  layout,
  gap,
  itemHeight,
  fill,
  alternate = false,
  width,
  size = 'page',
  className,
}: LoadingStateProps) {
  const {
    layout: chosen,
    isFilling,
    isNarrow,
    container,
  } = resolveLoading({
    layout,
    columns,
    fill,
    width,
    alternate,
    size,
  })
  const strategy = loadingStrategies[chosen]
  const measure = {
    gap: gap ?? strategy.measures[size].gap,
    itemHeight: itemHeight ?? strategy.measures[size].itemHeight,
  }
  // A layout that starts at the edge of its container has none of the padding of the size.
  const padding = strategy.isFlush ? flushPadding : sizePadding[size]
  const { ref, size: box } = useElementSize<HTMLDivElement>()
  const fitted =
    isFilling && box !== null
      ? strategy.fit(Math.max(0, box.height - padding.verticalPx), measure, rows)
      : { rows, itemHeight: measure.itemHeight }
  const Container = loadingContainers[container]

  return (
    <Container
      label={label}
      className={className}
      paddingClassName={padding.className}
      isNarrow={isNarrow}
      containerRef={ref}
    >
      <strategy.Layout
        rows={fitted.rows}
        itemHeight={fitted.itemHeight}
        columns={columns ?? defaultColumns}
        gap={measure.gap}
        alternate={alternate}
      />
    </Container>
  )
}
