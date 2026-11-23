import { paletteColors } from './palette.constants'

// The 32-bit FNV-1a hash: the offset basis and the prime of the algorithm.
const fnvOffset = 2166136261
const fnvPrime = 16777619

/** A whole number from a text, the same for the same text: the seed of everything a name looks like. */
export function hashOf(text: string): number {
  let hash = fnvOffset
  for (const letter of text) {
    hash = Math.imul(hash ^ (letter.codePointAt(0) ?? 0), fnvPrime)
  }
  return hash >>> 0
}

/**
 * A seed with its bits stirred (the finalizer of the 32-bit murmur3 hash), so that texts that
 * hash to numbers with a pattern between them, such as one that is about twice another, do not
 * give looks that are alike.
 */
export function stirred(seed: number): number {
  let mixed = seed ^ (seed >>> 16)
  mixed = Math.imul(mixed, 0x85ebca6b)
  mixed ^= mixed >>> 13
  mixed = Math.imul(mixed, 0xc2b2ae35)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

/**
 * The color of a text, the same each time: one of the colors given, the palette of the interface
 * unless others are. The caller decides what counts as the text and which colors are allowed.
 */
export function colorOf(text: string, colors: readonly string[] = paletteColors): string {
  const color = colors[stirred(hashOf(text)) % colors.length]
  if (color === undefined) throw new Error('No color to take')
  return color
}
