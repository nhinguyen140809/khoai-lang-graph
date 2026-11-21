import { CircleSmallIcon, type LucideIcon, type LucideProps } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * The small Circle of lucide filled with the color of its stroke, a little smaller than the icon
 * around it. The color comes from the text around it, as with every lucide icon.
 */
export const DotIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(function DotIcon(
  { className, ...props },
  ref,
) {
  return (
    <CircleSmallIcon
      ref={ref}
      className={cn('scale-90', className)}
      {...props}
      fill="currentColor"
      stroke="none"
    />
  )
})
