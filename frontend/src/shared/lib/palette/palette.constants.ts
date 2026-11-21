/**
 * The soft colors that a name takes its color from, as tokens, in the order of their hue around
 * the color wheel: orange, yellow, lime, mint, sky blue, blue, violet, pink, rose and coral, a warm
 * red-orange, which comes just before the orange as the wheel closes. They are paler in the dark
 * theme and deeper in the light theme. The face of an agent takes one or two of them, and the
 * block of a folder or of an item takes one.
 */
export const paletteColors = [
  'var(--hue-orange)',
  'var(--hue-yellow)',
  'var(--hue-lime)',
  'var(--hue-mint)',
  'var(--hue-sky)',
  'var(--hue-blue)',
  'var(--hue-violet)',
  'var(--hue-pink)',
  'var(--hue-rose)',
  'var(--hue-coral)',
] as const
