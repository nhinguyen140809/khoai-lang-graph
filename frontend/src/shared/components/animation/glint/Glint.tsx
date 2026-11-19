import { cn } from 'cn'
import type { ComponentProps, CSSProperties } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

import { defaultColors, starClasses } from './glint.constants'
import type { GlintVariant } from './glint.types'

/**
 * A four-point star, after the sparkle icon, that fills out to a rounded square and draws back
 * while it turns: the sign that work goes on, where the wait is short or of no known length.
 * `Spinner` is the plainer turning ring. Without a color it takes the text color around it; with one it takes the solid fill of the tone, as the shape is thick.
 * Every variant glows in the colors that the star has at each moment, from a blurred copy under it. The `mesh` variant fills the star with a mesh of two colors that drifts inside it, and the `shift`
 * variant changes its color from the first to the second and back with each morph; both take `colors`
 * (the primary and the secondary by default) and not `color` For those who ask for less motion it stays a still star (the animations pause at their first
 * frame, see `styles.css`).
 */
export function Glint({
  className,
  color,
  variant = 'solid',
  colors = defaultColors,
  ...props
}: Omit<ComponentProps<'span'>, 'color'> & {
  color?: Tone
  variant?: GlintVariant
  colors?: readonly [string, string]
}) {
  // A glint that is hidden from assistive technology is a mark beside words, which name the status.
  const status = props['aria-hidden'] ? {} : { role: 'status', 'aria-label': 'Working' }
  const star = (
    <span
      aria-hidden
      className={cn('block size-full', starClasses[variant])}
      style={{ '--glint-a': colors[0], '--glint-b': colors[1] } as CSSProperties}
    >
      {variant === 'mesh' && (
        <>
          <span
            className="glint-blob glint-blob-a"
            style={{ '--glint-blob': 'var(--glint-a)' } as CSSProperties}
          />
          <span
            className="glint-blob glint-blob-b"
            style={{ '--glint-blob': 'var(--glint-b)' } as CSSProperties}
          />
        </>
      )}
    </span>
  )
  return (
    <span
      data-slot="glint"
      data-color={color}
      className={cn(
        'relative inline-block size-4 shrink-0 glint-frame',
        variant === 'solid' && color && [toneClasses[color], 'text-(--tone)'],
        className,
      )}
      {...status}
      {...props}
    >
      <span aria-hidden className="absolute inset-0 animate-glint-turn">
        {/* A blurred copy of the star under it, which the star does not cut off: it glows in the colors that the star has at every moment. */}
        <span className="absolute inset-0 glint-glow">{star}</span>
        {star}
      </span>
    </span>
  )
}
