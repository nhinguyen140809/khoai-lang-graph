import type { GlintVariant } from './glint.types'

/** The classes of the star by variant; whole class names, so that they are generated. */
export const starClasses = {
  solid: 'glint-solid',
  mesh: 'glint-mesh',
  shift: 'glint-shift',
} as const satisfies Record<GlintVariant, string>

/** The two colors of the `mesh` and `shift` variants when none are given: the primary and the secondary. */
export const defaultColors = ['var(--primary)', 'var(--secondary)'] as const
