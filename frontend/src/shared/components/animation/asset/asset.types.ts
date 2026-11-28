import type { IconBounds } from '../icon/icon.types'

/** A point of the geometry of an asset, in the units of its 24 by 24 frame: x to the right, y up, z toward the viewer. */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** The angle an asset is seen from: `yaw` turns it about its vertical axis, `pitch` tips it over to show its top, both in degrees. */
export interface AssetView {
  yaw: number
  pitch: number
}

/** The sizes an asset comes in, three steps of its own above the faces of the agents, so that every asset is as large at one size as another. */
export const assetSizes = ['lg', 'xl', '2xl'] as const

export type AssetSize = (typeof assetSizes)[number]

/**
 * One thin part of an asset: a flat shape in space, as its corners in order around it (the side
 * they wind around is its front), the color it takes (`a` or `b`), and how thick and how much
 * darker than that color it is. A part of no thickness is a sheet of paper: it is seen from both
 * sides, and it goes nearly flat when it is seen along its own plane.
 */
export interface AssetPlate {
  corners: readonly Vec3[]
  /** The corners of the hole it carries, when it is a ring. */
  inner?: readonly Vec3[] | undefined
  face: 'a' | 'b'
  /** How far its front is backed by its own material, in units of the 24 by 24 frame; a sheet of paper when none is given. */
  thickness?: number | undefined
  /** How much darker it is over what the light makes it, as a share of black; none when it is neither an inset nor a back. */
  shade?: number | undefined
  /** Whether it shows a light of its own, as the display of a laptop: the light around it does not darken it. */
  glow?: boolean | undefined
  /** Whether its corners are a disc of a count divisible by four, to be drawn as the true curve through them instead of the straight run from one to the next. */
  round?: boolean | undefined
  /** The middles of the circles its first edge (corners one to two) and second edge (corners three to four) run along, for the two to bulge to their true curve, as the sides of a tube do. */
  bulge?: { first: Vec3; second: Vec3 } | undefined
  /** How far from each of its corners its outline begins to curve, in units of the 24 by 24 frame, when its corners are drawn rounded as true curves. */
  soft?: number | undefined
  /** The outward normals at the two ends of a wall of a tube or a ring, for its fill to run from the color of one end to the color of the other, so that it reads round. */
  shadeAlong?: { from: Vec3; to: Vec3 } | undefined
  /** How much of what stands behind it is seen through it, from none to all; solid when none is given. */
  opacity?: number | undefined
}

/** What a plate of an asset is told as, in data: its tone and its build, and a turn put on the whole of it. */
export type PlateSpec = PlateShape & PlateTone

/** The shape of a plate told as data, one of three ways: a sheet from a corner along two ways, a disc in a plane, or its corners given outright, with a hole of given corners when it is a frame. */
export type PlateShape =
  | { box: { at: Vec3; across: Vec3; up: Vec3 } }
  | {
      disc: { at: Vec3; radius: number; across: Vec3; up: Vec3; inner?: number | undefined }
    }
  | { poly: { corners: readonly Vec3[]; inner?: readonly Vec3[] | undefined } }

/** The tone and the build of a plate told as data: the color it takes, and the same build a plate in code takes. */
export interface PlateTone {
  face: 'a' | 'b'
  thickness?: number | undefined
  soft?: number | undefined
  shade?: number | undefined
  opacity?: number | undefined
  glow?: boolean | undefined
  /** A turn put on the whole of the plate: about a point, along a way, by so many degrees. */
  turn?: { about: Vec3; along: Vec3; by: number } | undefined
}

/** An asset told as data: what its plates are, in a frame of its own bounds. It stands still over its clock, for a thing that moves with it is told in code. */
export interface AssetSpec {
  bounds: IconBounds
  /** How far the far faces fade into the color of the background, from none to all; none when it is not asked for. */
  fade?: number | undefined
  plates: readonly PlateSpec[]
}

/** One face of an asset, ready for the screen: its outline as a closed path, the color it is filled with, and, for the wall of a tube or a ring, the spread of its fill: a run from one side of it to the other, each side in its own color, drawn as a gradient between them, so that the wall reads round instead of in bands. */
export interface DrawnPlate {
  d: string
  fill: string
  spread?:
    | {
        from: { x: number; y: number }
        to: { x: number; y: number }
        fills: readonly [string, string]
      }
    | undefined
}
