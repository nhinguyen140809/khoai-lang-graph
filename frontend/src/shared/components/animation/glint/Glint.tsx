'use client'

import { cn } from 'cn'
import { motion, type MotionStyle, type MotionValue } from 'motion/react'
import { type ComponentProps, type CSSProperties, type ReactNode, useRef } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'
import { useIsInView } from '@/shared/lib/viewport'

import { markBesideWords, workingStatus } from '../status.constants'
import { defaultColors } from './glint.constants'
import type { GlintVariant } from './glint.types'
import { useGlintMorph } from './hooks/useGlintMorph'

/**
 * The classes of the frame of the glint by variant: the solid one takes the tone of a given color,
 * and the mesh and the shift ones draw their own colors inside the star and keep the text color
 * around them. A variant that comes later says here what its frame wears.
 */
const frameClasses: Record<GlintVariant, (color: Tone | undefined) => string[]> = {
  solid: (color) => (color === undefined ? [] : [toneClasses[color], 'text-(--tone)']),
  mesh: () => [],
  shift: () => [],
}

/** What the star holds by variant: the mesh one holds two blobs of color that drift inside it. */
const starInside: Record<GlintVariant, ReactNode> = {
  solid: null,
  mesh: (
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
  ),
  shift: null,
}

interface GlintStarProps {
  variant: GlintVariant
  colors: readonly [string, string]
  clipPath: MotionValue<string>
  mix: MotionValue<number>
}

/** The star of the glint: the shape that turns, filled the way its variant fills it. */
function GlintStar({ variant, colors, clipPath, mix }: GlintStarProps) {
  return (
    <motion.span
      aria-hidden
      data-slot="glint-star"
      data-variant={variant}
      className="block size-full"
      style={
        {
          clipPath,
          '--glint-a': colors[0],
          '--glint-b': colors[1],
          '--glint-mix': mix,
        } as MotionStyle
      }
    >
      {starInside[variant]}
    </motion.span>
  )
}

/**
 * A four-point star, after the sparkle icon, that fills out to a rounded square and draws back
 * while it turns: the sign that work goes on, where the wait is short or of no known length.
 * `Spinner` is the plainer turning ring. Without a color it takes the text color around it; with one it takes the solid fill of the tone, as the shape is thick.
 * Every variant glows in the colors that the star has at each moment, from a blurred copy under it. The `mesh` variant fills the star with a mesh of two colors that drifts inside it, and the `shift`
 * variant changes its color from the first to the second and back with each morph; both take `colors`
 * (the primary and the secondary by default) and not `color` For those who ask for less motion it stays a still star (the animations pause at their first
 * frame, see `styles.css`). Out of sight it stops where it is..
 */
export function Glint({
  className,
  color,
  variant = 'solid',
  colors = defaultColors,
  'aria-hidden': isHidden,
  ...props
}: Omit<ComponentProps<'span'>, 'color'> & {
  color?: Tone
  variant?: GlintVariant
  colors?: readonly [string, string]
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const { clipPath, mix } = useGlintMorph(isInView)
  const star = <GlintStar variant={variant} colors={colors} clipPath={clipPath} mix={mix} />
  return (
    <span
      ref={ref}
      data-slot="glint"
      data-color={color}
      className={cn(
        'relative inline-block size-4 shrink-0 glint-frame',
        frameClasses[variant](color),
        !isInView && 'glint-paused',
        className,
      )}
      {...(isHidden ? markBesideWords : workingStatus)}
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
