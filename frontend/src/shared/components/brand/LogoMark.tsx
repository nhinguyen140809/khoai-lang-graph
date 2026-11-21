import { cn } from '@/shared/lib/cn'

import type { BrandVariant } from './brand.types'
import { logoLetter, logoViewBox } from './logo.constants'

// The square of each variant: the color of the app, or the colors of the text.
const variantClasses = {
  brand: 'bg-primary text-primary-foreground',
  plain: 'bg-foreground text-background',
} as const satisfies Record<BrandVariant, string>

interface LogoMarkProps {
  variant?: BrandVariant
  /** Sets the size of the square, `size-4` by default; the letter keeps its share of it. */
  className?: string
}

/**
 * The mark of the app: the letter K in a square, of the primary color or of the colors of the text.
 * The letter is a path in an SVG that fills the square, so it grows and shrinks with the square.
 * The route `src/app/icon.svg/route.ts` draws the same path from the same constants, for the icon
 * of the browser tab.
 */
export function LogoMark({ variant = 'brand', className }: LogoMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm',
        variantClasses[variant],
        className,
      )}
    >
      <svg viewBox={logoViewBox} className="size-full">
        <path
          d={logoLetter.path}
          fill="none"
          stroke="currentColor"
          strokeWidth={logoLetter.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
