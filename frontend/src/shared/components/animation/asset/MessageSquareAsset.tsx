'use client'

import { assetBounds } from './asset.constants'
import type { AssetSpec } from './asset.types'
import { assetIconOf } from './SpecIcon'

/** The bubble of the message: how thick it stands, and how far from each of its corners its outline begins to curve. */
const bubble = { thickness: 0.9, soft: 1 }

/** The words within the bubble: three dots, how wide, and how far apart they stand. */
const words = { dot: 0.5, apart: 1.8, at: 2.6 }

const message = {
  bounds: assetBounds.messageSquare,
  fade: 0.4,
  plates: [
    {
      poly: {
        corners: [
          { x: -4.7, y: 5.8, z: 0 },
          { x: -4.7, y: -3.9, z: 0 },
          { x: -2, y: -2.2, z: 0 },
          { x: 4.7, y: -2.2, z: 0 },
          { x: 4.7, y: 5.8, z: 0 },
        ],
      },
      face: 'a',
      thickness: bubble.thickness,
      soft: bubble.soft,
    },
    ...[-1, 0, 1].map(
      (
        place,
      ): {
        disc: {
          at: { x: number; y: number; z: number }
          radius: number
          across: { x: number; y: number; z: number }
          up: { x: number; y: number; z: number }
        }
        face: 'b'
      } => ({
        disc: {
          at: { x: place * words.apart, y: words.at, z: 0.04 },
          radius: words.dot,
          across: { x: 1, y: 0, z: 0 },
          up: { x: 0, y: 1, z: 0 },
        },
        face: 'b',
      }),
    ),
  ],
} as const satisfies AssetSpec

/**
 * A message drawn as an asset: a slim bubble with rounded corners and a small tail at its
 * lower corner, and three round dots of words within it. It stands still over the round, and it
 * comes out as a block with its far side faded into the background, whichever way it is seen
 * from.
 */
export const MessageSquareAsset = assetIconOf(message)
