import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { Button } from '@/shared/components/ui/button'

/**
 * A row of a list in a box: a ghost button the whole width, with no fill until the pointer is on
 * it. The rows are as tall as they need, so that they need no gap between them.
 */
export function RowButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        'h-10 w-full justify-start gap-3 rounded-lg px-3 text-left font-normal',
        className,
      )}
      {...props}
    />
  )
}
