import type { RingsColors, RingShape, RingsVariant } from './rings.types'

/** The colors of the first and the second ring when none are given. */
export const defaultRingColors = [
  'var(--primary)',
  'var(--secondary)',
] as const satisfies RingsColors

/** The size of the drawing, and of each ring in it: the first ring leaves room for the stroke. */
export const ringsBox = { size: 32, firstRadius: 13, secondRadius: 12, strokeWidth: 3.4 } as const

/** The size of the rings by name; whole class names, so that they are generated. */
export const ringsSizeClasses = { sm: 'size-5', default: 'size-6', lg: 'size-10' } as const

/** The handle of a curve that makes a sixth of a circle. */
const circleHandle = 0.3573

/** The shapes that the rings go through, by name. */
export const ringShapes = {
  circle: {
    radii: [1, 1, 1, 1, 1, 1],
    turns: [0, 0, 0, 0, 0, 0],
    handles: [circleHandle, circleHandle, circleHandle, circleHandle, circleHandle, circleHandle],
  },
  roundA: {
    radii: [1.04, 0.97, 0.94, 1, 0.96, 1.02],
    turns: [0, 4, -3, 2, -4, 3],
    handles: [0.36, 0.36, 0.36, 0.36, 0.36, 0.36],
  },
  roundB: {
    radii: [0.95, 1.03, 1, 0.94, 1.04, 0.98],
    turns: [-3, 2, 5, -2, 3, -4],
    handles: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
  },
  blobA: {
    radii: [1.05, 0.8, 0.95, 0.72, 1, 0.85],
    turns: [8, -10, 5, 12, -6, 4],
    handles: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  },
  blobB: {
    radii: [0.82, 1.05, 0.75, 0.98, 0.7, 0.95],
    turns: [-10, 6, 14, -8, 10, -5],
    handles: [0.34, 0.34, 0.34, 0.34, 0.34, 0.34],
  },
  blobC: {
    radii: [0.95, 0.72, 1.05, 0.8, 1, 0.7],
    turns: [5, 14, -8, -4, 10, -12],
    handles: [0.42, 0.42, 0.42, 0.42, 0.42, 0.42],
  },
  // The next four repeat their first two points three times: they look the same after a third of a turn.
  // An equilateral triangle with round corners: a corner, then the middle of the side after it.
  triangle: {
    radii: [1.06, 0.66, 1.06, 0.66, 1.06, 0.66],
    turns: [0, 0, 0, 0, 0, 0],
    handles: [0.36, 0.55, 0.36, 0.55, 0.36, 0.55],
  },
  hexagon: {
    radii: [1.05, 0.93, 1.05, 0.93, 1.05, 0.93],
    turns: [0, 0, 0, 0, 0, 0],
    handles: [0.18, 0.3, 0.18, 0.3, 0.18, 0.3],
  },
  trefoil: {
    radii: [1.05, 0.8, 1.05, 0.8, 1.05, 0.8],
    turns: [10, -10, 10, -10, 10, -10],
    handles: [0.36, 0.36, 0.36, 0.36, 0.36, 0.36],
  },
  star: {
    radii: [1.05, 0.45, 1.05, 0.45, 1.05, 0.45],
    turns: [0, 0, 0, 0, 0, 0],
    handles: [0.2, 0.3, 0.2, 0.3, 0.2, 0.3],
  },
} as const satisfies Record<string, RingShape>

/** The three shapes that each ring of each variant goes through in turn, and back to the first. */
export const ringsShapesByVariant = {
  mixed: {
    first: ['roundA', 'roundB', 'circle'],
    second: ['blobA', 'blobB', 'blobC'],
  },
  angular: {
    first: ['triangle', 'hexagon', 'trefoil'],
    second: ['star', 'trefoil', 'triangle'],
  },
} as const satisfies Record<
  RingsVariant,
  Record<'first' | 'second', readonly (keyof typeof ringShapes)[]>
>
