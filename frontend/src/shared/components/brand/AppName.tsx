import type { BrandVariant } from './brand.types'
import { LogoMark } from './LogoMark'
import { Wordmark } from './Wordmark'

/** The mark and the name of the app, side by side. */
export function AppName({ variant = 'brand' }: { variant?: BrandVariant }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark variant={variant} />
      <Wordmark variant={variant} />
    </span>
  )
}
