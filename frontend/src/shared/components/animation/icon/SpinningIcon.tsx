import { Loader2Icon, type LucideIcon, type LucideProps } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

/** The spinner of lucide, as an icon that turns by itself, except for who asks for less motion. */
export const SpinningIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  function SpinningIcon({ className, ...props }, ref) {
    return (
      <Loader2Icon
        ref={ref}
        className={cn('animate-spin motion-reduce:animate-none', className)}
        {...props}
      />
    )
  },
)
