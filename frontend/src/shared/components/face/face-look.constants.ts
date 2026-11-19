/**
 * The colors a face takes its colors from, as the tokens of the faces, in the order of their hue
 * around the color wheel: orange, yellow, lime, mint, sky blue, blue, violet, pink, rose and coral,
 * a warm red-orange, which comes just before the orange as the wheel closes. They are soft colors
 * from the Night Owl palette, paler in the dark theme and deeper in the light theme. A face has one
 * or two of them. They are colors only: the eyes and the brows are the same dark color on all of
 * them, `--face-features`.
 */
export const faceColors = [
  'var(--face-orange)',
  'var(--face-yellow)',
  'var(--face-lime)',
  'var(--face-mint)',
  'var(--face-sky)',
  'var(--face-blue)',
  'var(--face-violet)',
  'var(--face-pink)',
  'var(--face-rose)',
  'var(--face-coral)',
] as const

/**
 * How many places apart, around the color wheel, the two colors of a face are at least. Neighbors
 * in the list are close in hue, so two of them show a soft change of color.
 */
export const minColorGap = 1

/**
 * How many places apart the two colors of a face are at most. Two colors across the wheel from each
 * other blur into a gray middle, and ones far apart show every hue on the way, like a rainbow; two
 * colors within three places keep the change soft.
 */
export const maxColorGap = 3

/**
 * The share of faces that have one color. Two colors give many more faces (a pair of each two
 * colors that are close enough), so a few single ones are enough, and the agents of a workflow
 * seldom look alike.
 */
export const singleColorShare = 0.2

/** How far from the middle of the face, in percent, the deep blob sits: near the center. */
export const blobCoreRadius = { min: 6, max: 28 } as const

/** How wide the deep blob is, as a share of the face: a small one or a wide one. */
export const blobReach = { min: 74, max: 92 } as const

/**
 * How far from the middle, in percent, the second blob sits, on the side that is about opposite to
 * the first: the other color spreads out from there, over the rest of the face.
 */
export const blobFarRadius = { min: 30, max: 42 } as const

/**
 * From this many places apart on the wheel, the two colors of a face are too far from each other to
 * meet in the middle: the main color is no longer near the center, and the two sit on opposite
 * sides, each at its own place.
 */
export const farApartGap = 3

/** How far from the middle, in percent, each of the two blobs sits when the colors are far apart. */
export const blobSideRadius = { min: 24, max: 34 } as const

/**
 * Where the two blobs sit, by how far apart the colors are: from each gap on, the core blob and the
 * second blob are placed in the distances of that entry. The last entry whose gap the colors reach
 * is the one that holds.
 */
export const blobLayouts = [
  { fromGap: 0, core: blobCoreRadius, far: blobFarRadius },
  { fromGap: farApartGap, core: blobSideRadius, far: blobSideRadius },
] as const

/** How far the second blob may turn from the exact opposite of the first, in radians. */
export const blobSpotTurn = 0.7
