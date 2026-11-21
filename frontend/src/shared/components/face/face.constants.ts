import type { EyeGeometry, EyeKind } from './face.types'
import type { BlobShape, EyeGap, FaceShape } from './look/face-look.types'

/** The face is drawn in a square of this many units; its eyes sit on this line, in the middle. */
export const faceUnits = 32

/**
 * The height of the line of the eyes in each outline, in the units of the face: where each shape
 * has room for them. A drop is fullest low down; a ghost, which has no feet, high up.
 */
export const shapeEyeLines = {
  circle: 16,
  squircle: 16,
  blob: 16.5,
  pill: 16,
  ghost: 15,
  drop: 19,
  hexagon: 16,
  oval: 16,
} as const satisfies Record<FaceShape, number>

/**
 * How much of the extra reach of the eyes (`eyeReach`) each outline takes, from none to all: an oval
 * is the one with little room beside and above the eyes.
 */
export const shapeEyeReachShares = {
  circle: 1,
  squircle: 1,
  blob: 1,
  pill: 1,
  ghost: 1,
  drop: 1,
  hexagon: 1,
  oval: 0.6,
} as const satisfies Record<FaceShape, number>

/** The size of each kind of eye. Everything drawn about an eye, and over it, is worked out from this. */
export const eyeGeometries = {
  long: { halfWidth: 2.4, halfHeight: 4.8 },
  round: { halfWidth: 3.6, halfHeight: 3.6 },
  tall: { halfWidth: 3.2, halfHeight: 4.4 },
  flat: { halfWidth: 3.8, halfHeight: 2.2 },
  arc: { halfWidth: 2.9, halfHeight: 1.3 },
  shut: { halfWidth: 2.9, halfHeight: 1.3 },
} as const satisfies Record<EyeKind, EyeGeometry>

/** The clear space between the two eyes, by how far apart they are: it comes on top of the width of the eyes. */
export const eyeSpacing = { near: 2, mid: 3.6, far: 5.2 } as const satisfies Record<EyeGap, number>

/** The classes of a blob by its shape; whole class names, so that they are generated. */
export const blobShapeClasses = {
  round: 'face-shape-round',
  blob: 'face-shape-blob',
  ellipse: 'face-shape-ellipse',
  streak: 'face-shape-streak',
} as const satisfies Record<BlobShape, string>

/** The classes of the outline of a face by its shape; whole class names, so that they are generated. */
export const faceSilhouetteClasses = {
  circle: 'face-silhouette-circle',
  squircle: 'face-silhouette-squircle',
  blob: 'face-silhouette-blob',
  pill: 'face-silhouette-pill',
  ghost: 'face-silhouette-ghost',
  drop: 'face-silhouette-drop',
  hexagon: 'face-silhouette-hexagon',
  oval: 'face-silhouette-oval',
} as const satisfies Record<FaceShape, string>

export const faceSizeClasses = {
  sm: 'size-6 face-depth-sm',
  default: 'size-8 face-depth-md',
  lg: 'size-10 face-depth-lg',
  xl: 'size-14 face-depth-xl',
  '2xl': 'size-20 face-depth-xl',
} as const

/** How many layers of depth a face has. */
export const faceLayerCount = 6
