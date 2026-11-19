import {
  CircleSmallIcon,
  createLucideIcon,
  Loader2Icon,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

/** An exclamation mark alone, in the stroke of the lucide icons: a line over a point. */
export const ExclamationIcon: LucideIcon = createLucideIcon('Exclamation', [
  ['path', { d: 'M12 5v9', key: 'line' }],
  ['path', { d: 'M12 19h.01', key: 'point' }],
])

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
