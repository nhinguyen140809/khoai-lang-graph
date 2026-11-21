/** The two colors of the `mesh` and `shift` variants when none are given: the primary and the secondary. */
export const defaultColors = ['var(--primary)', 'var(--secondary)'] as const

/** How long one round of the star takes, from the star to the rounded square and back, in milliseconds. */
export const glintMorphMs = 2400

/**
 * The outline of the star at three moments of its round, as the half of one quarter of it, from the
 * tip of a point to the middle of the curve (in percent of the width of the star). The rest of the
 * outline is these points mirrored across the diagonal and turned by a quarter, three times over, so
 * that every shape has 48 points and the shapes can be mixed point by point.
 */
export const glintShapes = {
  star: [
    [100, 50],
    [79.9, 53.9],
    [74.4, 56.5],
    [70.9, 58.7],
    [68.3, 60.6],
    [66.1, 62.4],
    [64.2, 64.2],
  ],
  fuller: [
    [100, 50],
    [91.2, 55.4],
    [85.9, 59.6],
    [81.7, 63.1],
    [78.2, 66.3],
    [75.1, 69.2],
    [72.1, 72.1],
  ],
  square: [
    [100, 50],
    [99.1, 56.5],
    [97.1, 62.6],
    [94.4, 68.4],
    [91.1, 73.8],
    [87.4, 78.7],
    [83.3, 83.3],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>

/** The shape at each stop of the round (from 0 to 1): the star, filling out to the rounded square at the middle, and back. */
export const glintMorphStops = [
  { at: 0, shape: 'star' },
  { at: 0.25, shape: 'fuller' },
  { at: 0.5, shape: 'square' },
  { at: 0.75, shape: 'fuller' },
  { at: 1, shape: 'star' },
] as const
