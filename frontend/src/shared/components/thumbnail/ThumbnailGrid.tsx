import { cn } from 'cn'
import type { ComponentProps } from 'react'

/** The grid that the thumbnails of a folder sit in, with room above each for the tab of a folder and the papers that rise out of it. */
export function ThumbnailGrid({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('thumbnail-grid gap-x-4 gap-y-6 pt-6', className)} {...props} />
}
