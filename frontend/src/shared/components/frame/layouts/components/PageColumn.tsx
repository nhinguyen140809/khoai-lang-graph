import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

/** The widths of the column of a page: `reading` for a document or a list, `chat` for a conversation. */
const columnWidths = { reading: 'max-w-3xl', chat: 'max-w-4xl' } as const

interface PageColumnProps extends ComponentProps<'div'> {
  width?: keyof typeof columnWidths
  /**
   * Leaves out the padding, for a column that holds something with padding of its own, such as the
   * placeholder of a page that loads.
   */
  isFlush?: boolean
}

/**
 * The column that holds the content of a page, in the middle of it, as wide as the content reads
 * well and never wider than the page. The placeholder of a page that loads sits in the same
 * column, so the content does not change its width when it arrives.
 */
export function PageColumn({
  width = 'reading',
  isFlush = false,
  className,
  ...props
}: PageColumnProps) {
  return (
    <div
      className={cn('mx-auto w-full', columnWidths[width], !isFlush && 'p-6', className)}
      {...props}
    />
  )
}
