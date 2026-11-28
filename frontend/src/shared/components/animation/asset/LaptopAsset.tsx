'use client'

import { assetBounds } from './asset.constants'
import type { AssetSpec, Vec3 } from './asset.types'
import { rectCornersOf } from './draw/shape.utils'
import { assetIconOf } from './SpecIcon'

/** The laptop as thin plates, as wide next to its depth as a MacBook is, about 7 to 5. The screen is as wide as the base and as tall as it is deep, so that the two fold onto one another as the halves of a real one. */
const base = { width: 12.6, depth: 9, thickness: 0.6 }
const lid = { width: base.width, height: base.depth, thickness: 0.35 }

/** The lit display, as a sheet on the bezel of the screen, a little in front of it: nearly as wide and as tall as the bezel is, the same shape, as the display of a MacBook is. */
const display = { width: 12.1, height: 8.5, inset: 0.25, lift: 0.08 }

/** The keys, as an inset a little above the base, in the paler tone of the two. */
const keys = { width: 10.2, depth: 6.6, lift: 0.16 }

/** How far the screen leans back from standing straight, in degrees. */
const lean = 100

const open = (lean * Math.PI) / 180
const rise = { y: Math.sin(open), z: Math.cos(open) }
const out = { y: -Math.cos(open), z: Math.sin(open) }
const along = (x: number, upAlong: number): Vec3 => ({
  x,
  y: upAlong * rise.y,
  z: -base.depth / 2 + upAlong * rise.z,
})
const front = (x: number, upAlong: number): Vec3 => ({
  x,
  y: upAlong * rise.y + out.y * display.lift,
  z: -base.depth / 2 + upAlong * rise.z + out.z * display.lift,
})

/** A point on the rear of the screen: the lid's own thickness behind its bezel. */
const behind = (x: number, upAlong: number): Vec3 => ({
  x,
  y: upAlong * rise.y - out.y * lid.thickness,
  z: -base.depth / 2 + upAlong * rise.z - out.z * lid.thickness,
})

const laptop = {
  bounds: assetBounds.laptop,
  plates: [
    {
      poly: {
        corners: rectCornersOf(
          front,
          [-display.width / 2, display.inset],
          [display.width / 2, display.height - display.inset],
        ),
      },
      face: 'b',
      glow: true,
    },
    // The back of the screen: the lid closed behind its display, so the light of it shows on
    // its front only.
    {
      poly: {
        corners: rectCornersOf(
          behind,
          [-display.width / 2, display.inset],
          [display.width / 2, display.height - display.inset],
        ),
      },
      face: 'a',
    },
    {
      poly: {
        corners: rectCornersOf(along, [-lid.width / 2, 0], [lid.width / 2, lid.height]),
        inner: rectCornersOf(
          front,
          [-display.width / 2, display.inset],
          [display.width / 2, display.height - display.inset],
        ),
      },
      face: 'a',
      thickness: lid.thickness,
    },
    {
      poly: {
        corners: rectCornersOf(
          (across, upAlong) => ({ x: across, y: keys.lift, z: -upAlong }),
          [-keys.width / 2, -keys.depth / 2],
          [keys.width / 2, keys.depth / 2],
        ),
      },
      face: 'b',
    },
    {
      poly: {
        corners: rectCornersOf(
          (across, upAlong) => ({ x: across, y: 0, z: -upAlong }),
          [-base.width / 2, -base.depth / 2],
          [base.width / 2, base.depth / 2],
        ),
      },
      face: 'a',
      thickness: base.thickness,
    },
  ],
} as const satisfies AssetSpec

/**
 * A laptop drawn as an asset: a base the keys sit in, and a screen standing on the hinge at the
 * back of it, thin both, the two of one size, folding onto one another as the halves of a real
 * laptop. The screen is a bezel in the color of the body, with a display of its own light on
 * it. It stands still over the round, and it comes out as parallelograms under the view, for it
 * is a thin thing on a plane, seen from above the plane as the place around it looks at it.
 */
export const LaptopAsset = assetIconOf(laptop)
