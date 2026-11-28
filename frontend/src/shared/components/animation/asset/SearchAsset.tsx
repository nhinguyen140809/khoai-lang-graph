'use client'

import { assetBounds } from './asset.constants'
import type { AssetSpec, Vec3 } from './asset.types'
import { assetIconOf } from './SpecIcon'

/** The glass of the search: where the ring of its rim stands, how wide the rim is outside and within, how thick it runs, and where the lens within it sits. */
const glass = { at: { x: -1.6, y: 4.9, z: 0 }, outer: 3.5, inner: 2.5, thickness: 1.3 }

/** The lens within the rim: how much of what stands behind it is seen through it. */
const lens = { seeThrough: 0.35 }

/** The handle under the rim: how far it starts within the rim, how long it runs, how wide it lies, and how thick it is. */
const handle = { tuck: 0.25, length: 3.6, width: 1.2, thickness: 1.15 }

const across: Vec3 = { x: 1, y: 0, z: 0 }
const up: Vec3 = { x: 0, y: 1, z: 0 }
const way = { x: Math.SQRT1_2, y: -Math.SQRT1_2 }
const beside = { x: Math.SQRT1_2, y: Math.SQRT1_2 }
/** The corner of the handle where it starts, tucked into the rim, on its side away from the glass. */
const start = {
  x: glass.at.x + way.x * (glass.outer - handle.tuck) - (beside.x * handle.width) / 2,
  y: glass.at.y + way.y * (glass.outer - handle.tuck) - (beside.y * handle.width) / 2,
  z: 0,
}

const search = {
  bounds: assetBounds.search,
  fade: 0.5,
  plates: [
    {
      disc: { at: glass.at, radius: glass.outer, across, up, inner: glass.inner },
      face: 'a',
      thickness: glass.thickness,
    },
    {
      disc: {
        at: { x: glass.at.x, y: glass.at.y, z: glass.at.z - glass.thickness / 2 },
        radius: glass.inner - 0.05,
        across,
        up,
      },
      face: 'b',
      opacity: lens.seeThrough,
    },
    {
      box: {
        at: start,
        across: { x: way.x * handle.length, y: way.y * handle.length, z: 0 },
        up: { x: beside.x * handle.width, y: beside.y * handle.width, z: 0 },
      },
      face: 'a',
      thickness: handle.thickness,
    },
  ],
} as const satisfies AssetSpec

/**
 * A search glass drawn as an asset: a thick rim of a ring, a lens within it that is seen
 * through, and a handle running down from it, tucked into the rim so that it joins it. It
 * stands still over the round, and its rim comes out as a chunky ring with walls within and
 * without, its far side faded into the background, whichever way it is seen from.
 */
export const SearchAsset = assetIconOf(search)
