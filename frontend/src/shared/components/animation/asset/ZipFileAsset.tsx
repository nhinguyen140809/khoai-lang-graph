'use client'

import type { DrawnIconProps } from '../icon/icon.types'
import { assetBounds, defaultAssetView } from './asset.constants'
import type { AssetPlate, AssetView, DrawnPlate } from './asset.types'
import { AssetFrame } from './AssetFrame'
import { assetOf } from './draw/asset.utils'
import { rectCornersOf } from './draw/shape.utils'
import { turnedAbout } from './draw/turn.utils'

/** The box: how wide it stands, and how tall its walls run. */
const box = { side: 7.2, wall: 4.2 }

/**
 * The lid, in two wings that meet at the middle of the box when it is shut: how far they lean
 * open at rest, and how far they swing to each side over the round, in degrees.
 */
const lid = { lean: 50, reach: 33 }

/** How far the walls within the box fade into the color of the background, so that the ones without stand out over them. */
const fade = 0.45

/**
 * A zipped file drawn as an asset: an open box, and a lid of two wings on hinges at its sides
 * that swing shut over the round, meeting at the middle of the box, and open again, as a box
 * being closed by two doors is. Its walls are sheets, square around the outside of it, thin,
 * the ones within the box faded into the background so that the ones without stand over them,
 * whichever way it is seen from.
 */
export function ZipFileAsset({ progress, className, view }: DrawnIconProps) {
  return (
    <AssetFrame
      className={className}
      bounds={assetBounds.zip}
      progress={progress}
      view={view ?? defaultAssetView}
      animated
      draw={zipOf}
    />
  )
}

/** The faces of the box at a point of its clock under a view, farthest first. */
function zipOf(progress: number, view: AssetView): readonly DrawnPlate[] {
  const half = box.side / 2
  // A wall, from one corner of the box to another, standing on the plane as a sheet, wound so
  // that its outside faces out.
  const wall = (from: { x: number; z: number }, to: { x: number; z: number }): AssetPlate => ({
    corners: rectCornersOf(
      (along, upAlong) => ({
        x: from.x + (to.x - from.x) * along,
        y: upAlong * box.wall,
        z: from.z + (to.z - from.z) * along,
      }),
      [0, 0],
      [1, 1],
    ),
    face: 'a',
  })
  // The four walls, each a sheet the whole side of the box, square around its outside.
  const walls: readonly AssetPlate[] = [
    wall({ x: -half, z: half }, { x: half, z: half }),
    wall({ x: half, z: -half }, { x: -half, z: -half }),
    wall({ x: -half, z: half }, { x: -half, z: -half }),
    wall({ x: half, z: -half }, { x: half, z: half }),
  ]
  // The bottom, a sheet the floor of the box, wound so that its underside faces down.
  const bottom: AssetPlate = {
    corners: rectCornersOf(
      (across, upAlong) => ({ x: half - box.side * across, y: 0, z: -half + box.side * upAlong }),
      [0, 0],
      [1, 1],
    ),
    face: 'a',
    shade: 10,
  }
  // The two wings of the lid, flat on the top of the box when they are shut, meeting at its
  // middle, each swung up about the hinge at the top of its own side of the box as the round
  // goes.
  const open = lid.lean + lid.reach * Math.sin(progress * Math.PI * 2)
  const wing = (side: -1 | 1): AssetPlate => ({
    corners: rectCornersOf(
      (along, upAlong) =>
        turnedAbout(
          { x: side * half * (1 - along), y: box.wall, z: side * (-half + box.side * upAlong) },
          { origin: { x: side * half, y: box.wall, z: 0 }, direction: { x: 0, y: 0, z: 1 } },
          side * -open,
        ),
      [0, 0],
      [1, 1],
    ),
    face: 'b',
  })
  return assetOf([bottom, ...walls, wing(-1), wing(1)], view, fade)
}
