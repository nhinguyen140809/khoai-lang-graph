/**
 * The outlines a face can have: a circle, a rounded square, an uneven round one, a pill lying down,
 * a ghost, a drop, a hexagon and an oval (a wide ellipse leaning a little). Each is drawn in the square of the face, so every one of them holds
 * the eyes in the middle.
 */
export const faceShapes = [
  'circle',
  'squircle',
  'blob',
  'pill',
  'ghost',
  'drop',
  'hexagon',
  'oval',
] as const

export type FaceShape = (typeof faceShapes)[number]

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
 * same face everywhere. `shape` is its outline. `colors` are one or two different colors of the palette, as tokens of the
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
  shape: FaceShape
  gap: EyeGap
  phase: number
}

/** A range of numbers, the least and the most. */
export interface Range {
  min: number
  max: number
}

/** Where the two blobs sit for colors that are at least `fromGap` places apart: how far from the middle each is, in percent. */
export interface BlobLayout {
  fromGap: number
  core: Range
  far: Range
}

/**
 * What decides which faces can be: the palette they take their colors from, how far apart in it
 * the two colors of a face are, how many faces have one color, and how wide and where the blobs are.
 * The component holds a default; whoever uses it can give its own.
 */
export interface FaceRules {
  /** The outlines a face can have. */
  shapes: readonly FaceShape[]
  /** The colors a face is made of, in the order of their hue around the color wheel. */
  colors: readonly string[]
  /** How many places apart, around the wheel, the two colors of a face are at least. */
  minColorGap: number
  /** How many places apart the two colors of a face are at most. */
  maxColorGap: number
  /** The share of the faces that have one color, from 0 up to 1. */
  singleColorShare: number
  /** How wide the deep blob is, in percent of the face. */
  blobReach: Range
  /** Where the blobs sit by how far apart the colors are; the last entry whose gap the colors reach holds. */
  blobLayouts: readonly [BlobLayout, ...BlobLayout[]]
  /** How far the second blob may turn from the exact opposite of the first, in radians. */
  blobSpotTurn: number
  /** The faces made by hand: when there are any, an agent takes one of them, and the rest of the rules are not used. */
  presets?: readonly FacePreset[]
}

/** A face made by hand: everything of a look except the phase, which each agent has of its own. */
export type FacePreset = Omit<FaceLook, 'phase'>
