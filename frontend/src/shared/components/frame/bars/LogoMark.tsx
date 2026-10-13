import { cn } from '@/shared/lib/utils'

interface LogoMarkProps {
  /** Sets the size of the square, `size-4` by default; the letter keeps its share of it. */
  className?: string
}

/**
 * The mark of the app: the letter K in a square of the primary color. The letter is drawn in an
 * SVG that fills the square, so it grows and shrinks with the square: 9px in the 16px default.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="size-full">
        <text
          x="8"
          y="8"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fontWeight="600"
          fill="currentColor"
        >
          K
        </text>
      </svg>
    </span>
  )
}
