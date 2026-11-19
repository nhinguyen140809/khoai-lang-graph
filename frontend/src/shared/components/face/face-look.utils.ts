import {
  blobLayouts,
  blobReach,
  blobSpotTurn,
  faceColors,
  maxColorGap,
  minColorGap,
  singleColorShare,
} from './face-look.constants'
import {
  blobShapes,
  type BlobSpot,
  type EyeGap,
  eyeGaps,
  type EyeShape,
  eyeShapes,
  type FaceBlob,
  type FaceLook,
} from './face-look.types'

// The 32-bit FNV-1a hash: the offset basis and the prime of the algorithm.
const fnvOffset = 2166136261
const fnvPrime = 16777619

/** A whole number from a text, the same for the same text: the seed of everything a face looks like. */
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
 * give faces that look alike.
 */
function stirred(seed: number): number {
  let mixed = seed ^ (seed >>> 16)
  mixed = Math.imul(mixed, 0x85ebca6b)
  mixed ^= mixed >>> 13
  mixed = Math.imul(mixed, 0xc2b2ae35)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

/** The numbers from 0 up to 1 that a seed gives, one after another (the mulberry32 generator). */
function streamOf(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function pick<Item>(items: readonly Item[], next: () => number): Item {
  const item = items[Math.floor(next() * items.length)]
  if (item === undefined) throw new Error('Nothing to pick from')
  return item
}

const faceMiddle = 50

/** A place at an angle and a distance from the middle of the face. */
function spotAt(angle: number, distance: number): BlobSpot {
  return {
    x: Math.round(faceMiddle + distance * Math.cos(angle)),
    y: Math.round(faceMiddle + distance * Math.sin(angle)),
  }
}

/** The layout of the blobs for colors that are this many places apart. */
function layoutOf(apart: number): (typeof blobLayouts)[number] {
  return blobLayouts.findLast((layout) => apart >= layout.fromGap) ?? blobLayouts[0]
}

/**
 * The places of the two blobs. The first is near the middle, where the deep color sits; the second is
 * far from the middle on about the opposite side, where the other color spreads from. Two colors that
 * are far apart on the wheel do not meet in the middle: each sits on its own side.
 */
function spotsOf(next: () => number, apart: number): FaceLook['spots'] {
  const { core: coreRadius, far: farRadius } = layoutOf(apart)
  const angle = next() * 2 * Math.PI
  const core = spotAt(angle, coreRadius.min + next() * (coreRadius.max - coreRadius.min))
  const far = spotAt(
    angle + Math.PI + (next() - 0.5) * 2 * blobSpotTurn,
    farRadius.min + next() * (farRadius.max - farRadius.min),
  )
  return [core, far]
}

/** How many places apart two places of the palette are, going the shorter way round it. */
function placesApart(first: number, second: number): number {
  const direct = Math.abs(first - second)
  return Math.min(direct, faceColors.length - direct)
}

type ColorChoice = Pick<FaceLook, 'colors'> & { apart: number }

/** A face of one color. */
function singleColor(first: number): ColorChoice {
  return { colors: [colorAt(first)], apart: 0 }
}

/** A face of the first color and another, not far from it in hue, by the toss of the stream. */
function colorPair(first: number, next: () => number): ColorChoice {
  const second = pick(
    faceColors
      .map((_, place) => place)
      .filter((place) => {
        const apart = placesApart(first, place)
        return apart >= minColorGap && apart <= maxColorGap
      }),
    next,
  )
  return { colors: [colorAt(first), colorAt(second)], apart: placesApart(first, second) }
}

function colorAt(place: number): string {
  const color = faceColors[place]
  if (color === undefined) throw new Error('No color at this place')
  return color
}

/** The ways a face takes its colors, and the share of the faces that take each. */
const colorSchemes = [
  { share: singleColorShare, choose: singleColor },
  { share: 1 - singleColorShare, choose: colorPair },
] as const

/** An item by its share of the whole, by the toss of the stream. */
function pickByShare<Item extends { share: number }>(
  items: readonly Item[],
  next: () => number,
): Item {
  const total = items.reduce((sum, item) => sum + item.share, 0)
  const toss = next() * total
  let covered = 0
  for (const item of items) {
    covered += item.share
    if (toss < covered) return item
  }
  throw new Error('Nothing to pick from')
}

/** One color of the palette, or two that are not far apart in hue, by the toss of the stream. */
function colorsOf(next: () => number): ColorChoice {
  const places = Array.from({ length: faceColors.length }, (_, place) => place)
  const first = pick(places, next)
  return pickByShare(colorSchemes, next).choose(first, next)
}

/** The shape of a blob and how far it is turned, by the toss of the stream. */
function blobOf(next: () => number): FaceBlob {
  return { shape: pick(blobShapes, next), turn: Math.round(next() * 180) }
}

/**
 * The face of a seed, such as the key of an agent: the colors and the places of its blobs, the shape
 * of its eyes and how far apart they are. The agents are named by the workflow, so nothing is drawn
 * by hand for a name; any seed gives a face, the same one each time.
 */
export function faceOf(seed: string): FaceLook {
  const next = streamOf(stirred(hashOf(seed)))
  const eyes: EyeShape = pick(eyeShapes, next)
  const gap: EyeGap = pick(eyeGaps, next)
  const { apart, ...colors } = colorsOf(next)
  return {
    ...colors,
    spots: spotsOf(next, apart),
    reach: Math.round(blobReach.min + next() * (blobReach.max - blobReach.min)),
    eyes,
    gap,
    phase: next(),
    blobs: [blobOf(next), blobOf(next)],
  }
}
