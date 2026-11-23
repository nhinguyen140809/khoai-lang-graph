import { hashOf, stirred } from '@/shared/lib/palette'

import { defaultFaceRules } from './face-look.constants'
import {
  type BlobLayout,
  blobShapes,
  type BlobSpot,
  type EyeGap,
  eyeGaps,
  type FaceBlob,
  type FaceLook,
  type FaceRules,
  type FaceShape,
} from './face-look.types'

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
function layoutOf(rules: FaceRules, apart: number): BlobLayout {
  return rules.blobLayouts.findLast((layout) => apart >= layout.fromGap) ?? rules.blobLayouts[0]
}

/**
 * The places of the two blobs. The first is near the middle, where the deep color sits; the second is
 * far from the middle on about the opposite side, where the other color spreads from. Two colors that
 * are far apart on the wheel do not meet in the middle: each sits on its own side.
 */
function spotsOf(next: () => number, apart: number, rules: FaceRules): FaceLook['spots'] {
  const { core: coreRadius, far: farRadius } = layoutOf(rules, apart)
  const angle = next() * 2 * Math.PI
  const core = spotAt(angle, coreRadius.min + next() * (coreRadius.max - coreRadius.min))
  const far = spotAt(
    angle + Math.PI + (next() - 0.5) * 2 * rules.blobSpotTurn,
    farRadius.min + next() * (farRadius.max - farRadius.min),
  )
  return [core, far]
}

type ColorChoice = Pick<FaceLook, 'colors'> & { apart: number }

function colorAt(rules: FaceRules, place: number): string {
  const color = rules.colors[place]
  if (color === undefined) throw new Error('No color at this place')
  return color
}

/** How many places apart two places of the palette are, going the shorter way round it. */
function placesApart(rules: FaceRules, first: number, second: number): number {
  const direct = Math.abs(first - second)
  return Math.min(direct, rules.colors.length - direct)
}

/** A face of the first color and another, not far from it in hue, by the toss of the stream. */
function colorPair(rules: FaceRules, first: number, next: () => number): ColorChoice {
  const near = rules.colors
    .map((_, place) => place)
    .filter((place) => {
      const apart = placesApart(rules, first, place)
      return apart >= rules.minColorGap && apart <= rules.maxColorGap
    })
  // A palette with no color in the gap, such as one of a single color, gives a face of one color.
  if (near.length === 0) return { colors: [colorAt(rules, first)], apart: 0 }
  const second = pick(near, next)
  return {
    colors: [colorAt(rules, first), colorAt(rules, second)],
    apart: placesApart(rules, first, second),
  }
}

/** One color of the palette, or two that are not far apart in hue, by the toss of the stream. */
function colorsOf(rules: FaceRules, next: () => number): ColorChoice {
  const places = Array.from({ length: rules.colors.length }, (_, place) => place)
  const first = pick(places, next)
  const toss = next()
  return toss < rules.singleColorShare
    ? { colors: [colorAt(rules, first)], apart: 0 }
    : colorPair(rules, first, next)
}

/** The shape of a blob and how far it is turned, by the toss of the stream. */
function blobOf(next: () => number): FaceBlob {
  return { shape: pick(blobShapes, next), turn: Math.round(next() * 180) }
}

/**
 * The face of a seed, such as the key of an agent: the colors and the places of its blobs, the shape
 * of its outline and how far apart its eyes are, within the rules given (the default ones otherwise). The
 * agents are named by the workflow, so nothing is drawn by hand for a name; any seed gives a face,
 * the same one each time for the same rules.
 */
export function faceOf(seed: string, rules: FaceRules = defaultFaceRules): FaceLook {
  const next = streamOf(stirred(hashOf(seed)))
  const shape: FaceShape = pick(rules.shapes, next)
  const gap: EyeGap = pick(eyeGaps, next)
  const { apart, ...colors } = colorsOf(rules, next)
  return {
    ...colors,
    spots: spotsOf(next, apart, rules),
    reach: Math.round(rules.blobReach.min + next() * (rules.blobReach.max - rules.blobReach.min)),
    shape,
    gap,
    phase: next(),
    blobs: [blobOf(next), blobOf(next)],
  }
}
