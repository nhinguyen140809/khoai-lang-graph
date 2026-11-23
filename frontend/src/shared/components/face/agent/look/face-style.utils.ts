import type { CSSProperties } from 'react'

import type { FaceLook } from './face-look.types'

/**
 * How much of the lift color the second color of a name takes, by how many colors the face has: a
 * little for a second color, more for the shade of a single one.
 */
const nameLifts = { 1: '55%', 2: '40%' } as const

/** How much of the lift color the second blob takes, by how many colors the face has: little, so that it is a color and not just a paler base. */
const blobLifts = { 1: '10%', 2: '0%' } as const

/** A color lifted toward the lift color, so that it reads lighter. */
function liftedOf(color: string, share: string): string {
  return `color-mix(in oklch, ${color}, var(--face-lift) ${share})`
}

/** The deep color of the core: the color with a little more chroma (the tokens say how much, by theme) and the same light, so that it stands out from the lighter one without going dark. */
function deepenedOf(color: string): string {
  return `oklch(from ${color} l calc(min(c * var(--face-core-chroma), var(--face-core-chroma-max))) h)`
}

/**
 * The blobs of a face as the custom properties that `face-blob-core` and `face-blob-second` read:
 * the first color deep, near the center; the second color, lifted, spread from its own place, over a
 * pale base made from it. A face of one color spreads a lighter shade of it.
 */
export function blobStyleOf(look: FaceLook): CSSProperties {
  const [first, second] = look.colors
  const [core, far] = look.spots
  return {
    '--face-a': deepenedOf(first),
    '--face-b': liftedOf(second ?? first, blobLifts[look.colors.length]),
    '--face-base': liftedOf(second ?? first, 'var(--face-base-lift)'),
    '--face-reach': `${String(look.reach)}%`,
    '--face-ax': `${String(core.x)}%`,
    '--face-ay': `${String(core.y)}%`,
    '--face-bx': `${String(far.x)}%`,
    '--face-by': `${String(far.y)}%`,
    '--face-core-turn': `${String(look.blobs[0].turn)}deg`,
    '--face-second-turn': `${String(look.blobs[1].turn)}deg`,
    '--face-phase': look.phase,
  } as CSSProperties
}

/** A color of the name of an agent: the face color with some of the text color, so that it reads on the page. */
function inkOf(color: string): string {
  return `color-mix(in oklab, ${color} calc(100% - var(--face-text-shade)), var(--foreground))`
}

/** The colors of a face as the custom properties that `face-text` reads; one color goes to a lighter shade of itself. */
export function textStyleOf(look: FaceLook): CSSProperties {
  const [first, second] = look.colors
  return {
    '--face-a': inkOf(first),
    '--face-b': inkOf(liftedOf(second ?? first, nameLifts[look.colors.length])),
  } as CSSProperties
}

/** The delay that starts an animation part of the way through its time, by the phase of the face. */
export function delayOf(durationToken: string | null): { animationDelay?: string } {
  return durationToken === null
    ? {}
    : { animationDelay: `calc(var(--face-phase) * var(${durationToken}) * -1)` }
}
