'use client'

import type { DrawnIconProps } from '../icon/icon.types'
import { assetBounds, defaultAssetView } from './asset.constants'
import type { AssetPlate, AssetView, DrawnPlate, Vec3 } from './asset.types'
import { AssetFrame } from './AssetFrame'
import type { BoardShapeMark } from './boards/board.types'
import { assetOf } from './draw/asset.utils'
import { rectCornersOf } from './draw/shape.utils'
import { turnedAbout } from './draw/turn.utils'

/** The boards lying about on the plane: where each lies, how far it is turned on it, and how wide and deep it is. */
const lying: readonly {
  at: { x: number; z: number }
  turn: number
  width: number
  depth: number
}[] = [
  { at: { x: -3.4, z: 1.6 }, turn: -18, width: 8.6, depth: 6.2 },
  { at: { x: 3.5, z: -0.9 }, turn: 10, width: 8.2, depth: 6 },
  { at: { x: 0.2, z: -4.4 }, turn: 32, width: 7.6, depth: 5.6 },
]

/** How far what is drawn on a board stands off its face, and how much of what stands behind it is seen through it. */
const board = { lift: 0.04, seeThrough: 0.35 }

/** What scattered boards take beyond what every icon drawn by a clock takes: the marks drawn on each of them. */
export type ScatterProps = DrawnIconProps & {
  /** The marks drawn on every board, in shares of its width and its depth. */
  marks?: readonly BoardShapeMark[] | undefined
}

/**
 * Boards drawn as an asset, lying scattered on the plane of the frame: each flat on it, turned
 * and set askew on its own, as papers dropped on a desk are. The marks given are drawn on each
 * of them. They stand still over the round, and they read as sheets lying about, not lined up,
 * whichever way they are seen from.
 */
export function ScatterAsset({ progress, className, view, marks }: ScatterProps) {
  return (
    <AssetFrame
      className={className}
      bounds={assetBounds.scatter}
      progress={progress}
      view={view ?? defaultAssetView}
      draw={(at, seenFrom) => scatterOf(at, seenFrom, marks)}
    />
  )
}

/** The faces of the scattered boards at a point of its clock under a view, farthest first. */
function scatterOf(
  _progress: number,
  view: AssetView,
  marks: readonly BoardShapeMark[] | undefined,
): readonly DrawnPlate[] {
  const plates: AssetPlate[] = []
  for (const place of lying) {
    // The board, lying flat on the plane, turned askew on its own place.
    const laid = (across: number, upAlong: number, off = 0): Vec3 => {
      const corner = {
        x: place.at.x + across,
        y: off,
        z: place.at.z + upAlong,
      }
      return turnedAbout(
        corner,
        { origin: { x: place.at.x, y: 0, z: place.at.z }, direction: { x: 0, y: 1, z: 0 } },
        place.turn,
      )
    }
    plates.push({
      corners: rectCornersOf(
        laid,
        [-place.width / 2, -place.depth / 2],
        [place.width / 2, place.depth / 2],
      ),
      face: 'a',
      opacity: board.seeThrough,
    })
    // The marks, standing on the board.
    if (marks !== undefined) {
      for (const mark of marks) {
        plates.push({
          corners: mark.corners.map(([across, upAlong]) =>
            laid((across - 0.5) * place.width, (0.5 - upAlong) * place.depth, board.lift),
          ),
          face: mark.face,
          glow: mark.glow,
        })
      }
    }
  }
  return assetOf(plates, view)
}
