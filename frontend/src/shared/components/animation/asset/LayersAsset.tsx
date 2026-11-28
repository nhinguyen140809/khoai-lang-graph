'use client'

import { assetBounds } from './asset.constants'
import type { AssetSpec, Vec3 } from './asset.types'
import { assetIconOf } from './SpecIcon'

/** The layers of the stack: how wide each lies, how high it stands over the one below it, and how far it is turned on its own. */
const layers: readonly { side: number; at: number; turn: number; face: 'a' | 'b' }[] = [
  { side: 8.6, at: 0, turn: 0, face: 'a' },
  { side: 7.8, at: 1.3, turn: 18, face: 'b' },
  { side: 7, at: 2.6, turn: -12, face: 'a' },
]

/** A layer as a plate, told as data: a diamond lying flat, turned on its own over the one below it. */
const plates = layers.map(({ side, at, turn, face }) => {
  const half = side / 2
  const across: Vec3 = { x: -half, y: 0, z: half }
  const up: Vec3 = { x: half, y: 0, z: half }
  return {
    box: { at: { x: 0, y: at, z: -half }, across, up },
    face,
    thickness: 0.5,
    turn: { about: { x: 0, y: at, z: 0 }, along: { x: 0, y: 1, z: 0 }, by: turn },
  }
})

const stack = { bounds: assetBounds.layers, plates } as const satisfies AssetSpec

/**
 * Layers drawn as an asset: three flat diamonds lying one over another, each turned a little on
 * its own over the one below it, the largest at the bottom and the smallest at the top. They
 * stand still over the round, and they read as a stack of layers, whichever way they are seen
 * from.
 */
export const LayersAsset = assetIconOf(stack)
