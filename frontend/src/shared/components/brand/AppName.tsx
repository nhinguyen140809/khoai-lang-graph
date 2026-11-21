import { cn } from '@/shared/lib/cn'

import type { BrandVariant } from './brand.types'
import { LogoMark } from './LogoMark'
import { Wordmark } from './Wordmark'

// The size of each kind of place: a bar, and a screen of its own such as the login.
const sizeClasses = {
  md: { row: 'gap-2', mark: '', name: '' },
  lg: { row: 'gap-3', mark: 'size-9 rounded-lg', name: 'text-xl font-semibold tracking-tight' },
} as const

/** The mark and the name of the app, side by side. */
export function AppName({
  variant = 'brand',
  size = 'md',
}: {
  variant?: BrandVariant
  size?: keyof typeof sizeClasses
}) {
  const looks = sizeClasses[size]
  return (
    <span className={cn('flex items-center', looks.row)}>
      <LogoMark variant={variant} className={looks.mark} />
      <Wordmark variant={variant} className={looks.name} />
    </span>
  )
}
