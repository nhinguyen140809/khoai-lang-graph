'use client'

import type { DrawnIconProps } from '../icon/icon.types'
import { assetBounds, defaultAssetView } from './asset.constants'
import type { AssetPlate, AssetView, DrawnPlate, Vec3 } from './asset.types'
import { AssetFrame } from './AssetFrame'
import type { BoardShapeMark } from './boards/board.types'
import { assetOf } from './draw/asset.utils'
import { rectCornersOf } from './draw/shape.utils'
import { turnedAbout } from './draw/turn.utils'

/** The stack of sheets: how wide and how deep each lies, how thick each is, and how far one stands over the one below it. */
const sheet = { width: 10.5, depth: 8, thickness: 0.3, apart: 0.5 }

/** How each sheet lies askew over the one below it: the first of the list is the top of the stack. */
const askew: readonly { x: number; z: number; turn: number }[] = [
  { x: 0, z: 0, turn: 0 },
  { x: -0.6, z: 0.4, turn: -7 },
  { x: 0.4, z: -0.3, turn: 5 },
  { x: -0.3, z: -0.6, turn: 13 },
  { x: 0.7, z: 0.5, turn: -4 },
]

/** How much of what stands behind a sheet is seen through it. */
const seeThrough = 0.5

/** What a stack takes beyond what every icon drawn by a clock takes: the marks drawn on the sheet on top. */
export type StackProps = DrawnIconProps & {
  /** The marks drawn on the sheet at the top of the stack, in shares of its width and its depth. */
  marks?: readonly BoardShapeMark[] | undefined
}

/**
 * A stack of boards drawn as an asset: sheets lying flat on the plane of the frame, one over
 * another, each askew on its own turn over the one below it, as a pile of papers on a desk is.
 * The marks given are drawn on the sheet on top. It stands still over the round, and its sheets
 * read as layers one over another whichever way they are seen from.
 */
export function StackAsset({ progress, className, view, marks }: StackProps) {
  return (
    <AssetFrame
      className={className}
      bounds={assetBounds.stack}
      progress={progress}
      view={view ?? defaultAssetView}
      draw={(at, seenFrom) => stackOf(at, seenFrom, marks)}
    />
  )
}

/** The faces of the stack at a point of its clock under a view, farthest first. */
function stackOf(
  _progress: number,
  view: AssetView,
  marks: readonly BoardShapeMark[] | undefined,
): readonly DrawnPlate[] {
  const plates: AssetPlate[] = []
  askew.forEach((place, index) => {
    const height = (askew.length - 1 - index) * sheet.apart
    // The sheet, lying flat, askew on its own turn, its own place over the one below it.
    const laid = (across: number, upAlong: number, off = 0): Vec3 => {
      const corner = {
        x: place.x + across,
        y: height + off,
        z: place.z + upAlong,
      }
      return turnedAbout(
        corner,
        { origin: { x: place.x, y: height, z: place.z }, direction: { x: 0, y: 1, z: 0 } },
        place.turn,
      )
    }
    plates.push({
      corners: rectCornersOf(
        (across, upAlong) => laid(across, -upAlong),
        [-sheet.width / 2, -sheet.depth / 2],
        [sheet.width / 2, sheet.depth / 2],
      ),
      face: 'a',
      opacity: seeThrough,
      thickness: sheet.thickness,
    })
    // The marks, on the sheet at the top of the stack only: the ones below are covered.
    if (index === 0 && marks !== undefined) {
      for (const mark of marks) {
        plates.push({
          corners: mark.corners.map(([across, upAlong]) =>
            laid(
              (across - 0.5) * sheet.width,
              (0.5 - upAlong) * sheet.depth,
              sheet.thickness + 0.04,
            ),
          ),
          face: mark.face,
          glow: mark.glow,
        })
      }
    }
  })
  return assetOf(plates, view)
}
