import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * The container of a state in the `page` size: it fills the container it is in and puts the state
 * in the middle of it, horizontally and vertically.
 */
export function CenteredState({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex h-full min-h-48 w-full items-center justify-center p-6', className)}
      {...props}
    />
  )
}
