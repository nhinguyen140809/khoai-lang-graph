'use client'

import { assetBounds } from './asset.constants'
import type { AssetSpec } from './asset.types'
import { assetIconOf } from './SpecIcon'

/** The books of the library, told as data: blocks standing side by side, each in its own tone, the last one leaning on the rest. */
const library = {
  bounds: assetBounds.library,
  plates: [
    {
      box: {
        at: { x: -5.1, y: 0, z: 0 },
        across: { x: 1.2, y: 0, z: 0 },
        up: { x: 0, y: 6.4, z: 0 },
      },
      face: 'a',
      thickness: 3.6,
    },
    {
      box: {
        at: { x: -3.7, y: 0, z: 0 },
        across: { x: 0.9, y: 0, z: 0 },
        up: { x: 0, y: 7.2, z: 0 },
      },
      face: 'b',
      thickness: 3.6,
    },
    {
      box: {
        at: { x: -2.6, y: 0, z: 0 },
        across: { x: 1.4, y: 0, z: 0 },
        up: { x: 0, y: 5.8, z: 0 },
      },
      face: 'a',
      thickness: 3.6,
    },
    {
      box: {
        at: { x: -1.1, y: 0, z: 0 },
        across: { x: 1.1, y: 0, z: 0 },
        up: { x: 0, y: 6.6, z: 0 },
      },
      face: 'b',
      thickness: 3.6,
    },
    {
      box: {
        at: { x: 2.1, y: 0, z: 0 },
        across: { x: 1.3, y: 0, z: 0 },
        up: { x: 0, y: 6.2, z: 0 },
      },
      face: 'a',
      thickness: 3.6,
      turn: { about: { x: 2.1, y: 0, z: 0 }, along: { x: 0, y: 0, z: 1 }, by: 13 },
    },
  ],
} as const satisfies AssetSpec

/**
 * A library drawn as an asset: a row of books standing on the plane of the frame, each a block
 * of its own width, height and color, the last one leaning on the rest. It stands still over
 * the round, and it comes out as blocks with their covers toward the one that looks, whichever
 * way it is seen from.
 */
export const LibraryAsset = assetIconOf(library)
