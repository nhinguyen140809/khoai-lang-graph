import { cn } from '@/shared/lib/cn'

import type { BrandVariant } from './brand.types'

/** The name of the app, as it shows on screen. */
export const appName = 'khoai'

// The letters of the name that stand out, and the ones before them.
const plainPart = appName.slice(0, 3)
const brandPart = appName.slice(3)

/** The name of the app as text: the letters `ai` in the color of the app, the rest as the text around. */
export function Wordmark({
  variant = 'brand',
  className,
}: {
  variant?: BrandVariant
  className?: string
}) {
  return (
    <span className={cn('truncate', className)}>
      <span className="sr-only">{appName}</span>
      <span aria-hidden>
        {plainPart}
        <span className={variant === 'brand' ? 'text-primary' : undefined}>{brandPart}</span>
      </span>
    </span>
  )
}
