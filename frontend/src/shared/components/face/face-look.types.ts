/** The eyes that tell one face from another: round, long like a pill standing up, or flat. */
export const eyeShapes = ['round', 'long', 'slim'] as const

export type EyeShape = (typeof eyeShapes)[number]

/** How far apart the two eyes are, in the units of the face. */
export const eyeGaps = ['near', 'mid', 'far'] as const

export type EyeGap = (typeof eyeGaps)[number]

/** The shapes of a blob: a circle, an uneven round one, an ellipse and a long streak. */
export const blobShapes = ['round', 'blob', 'ellipse', 'streak'] as const

export type BlobShape = (typeof blobShapes)[number]

/** What a blob of color looks like besides its color and place: its shape, and how far it is turned, in degrees. */
export interface FaceBlob {
  shape: BlobShape
  turn: number
}

/** A place in the face, as a share of its width and of its height, in percent. */
export interface BlobSpot {
  x: number
  y: number
}

/**
 * What a face is, worked out from a seed alone, such as the key of an agent: the same seed gives the
 * same face everywhere. `colors` are one or two different colors of the palette, as tokens of the
 * interface, the first of them the main one; `spots` are the places of the two blobs of color, the deep one first; `reach` is how wide the deep blob is; `phase`, from 0
 * up to 1, is how far through their cycles the eyes are, so that two faces side by side do not
 * blink or glance together.
 */
export interface FaceLook {
  colors: readonly [string] | readonly [string, string]
  /** How wide the deep blob is, in percent of the face. */
  reach: number
  spots: readonly [BlobSpot, BlobSpot]
  /** The deep blob and the second blob. */
  blobs: readonly [FaceBlob, FaceBlob]
  eyes: EyeShape
  gap: EyeGap
  phase: number
}
