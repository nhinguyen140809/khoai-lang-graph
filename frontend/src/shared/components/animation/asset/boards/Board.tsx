'use client'

import type { ComponentType } from 'react'

import type { DrawnIconProps } from '../../icon/icon.types'
import { assetBounds, defaultAssetView } from '../asset.constants'
import type { AssetView, DrawnPlate } from '../asset.types'
import { AssetFrame } from '../AssetFrame'
import { assetOf } from '../draw/asset.utils'
import { turnedOf } from '../draw/turn.utils'
import type { BoardMark, BoardShape } from './board.types'
import { boardFace, boardPlatesOf, carriedMatrixOf, carriedSideOf } from './board.utils'

/** The marks of a report, the ones a board carries when none are given: bars of text over the area under a line that rises and dips. */
const report: readonly BoardMark[] = [
  {
    rect: { from: [0.06, 0.86], to: [0.32, 0.885] },
    face: 'a',
  },
  {
    rect: { from: [0.06, 0.79], to: [0.47, 0.815] },
    face: 'a',
  },
  {
    rect: { from: [0.06, 0.72], to: [0.24, 0.745] },
    face: 'a',
  },
  {
    corners: [
      [0.06, 0.12],
      [0.06, 0.26],
      [0.24, 0.19],
      [0.42, 0.33],
      [0.58, 0.27],
      [0.76, 0.42],
      [0.94, 0.36],
      [0.94, 0.12],
    ],
    face: 'b',
  },
]

/** What a board takes beyond what every icon drawn by a clock takes: its shape, the marks drawn on it, and an icon it carries. */
export type BoardProps = DrawnIconProps & {
  /** The shape it stands in; a sheet of a report when none is given. */
  shape?: BoardShape | undefined
  /** The marks drawn on its face, in shares of its width and its height; the marks of a report when neither these nor an icon is given. */
  marks?: readonly BoardMark[] | undefined
  /** An icon drawn on its face, in the middle of it, as large as it fits; the marks are left out when it is given and they are not. */
  icon?: ComponentType<DrawnIconProps> | undefined
}

/**
 * A board drawn as an asset: a translucent sheet standing a little back from straight, with marks
 * drawn on its face, or an icon it carries, by default the marks of a report, bars of text over a
 * chart. The marks are shares of its width and its height, so one set of them fits every shape a
 * board comes in, and another set can be given in their place. What stands on the sheet is laid
 * onto its plane by the same view that draws the sheet, so it turns with it, and what stands
 * behind the sheet is seen through it, whichever way it is seen from.
 */
export function Board({
  progress,
  className,
  stroke,
  view,
  shape = 'sheet',
  marks,
  icon: Icon,
}: BoardProps) {
  const onIt = marks ?? (Icon === undefined ? report : [])
  const seenFrom = view ?? defaultAssetView
  // A board moves with its clock only when one of its marks says how it moves.
  const hasMovingMarks = onIt.some((mark) => mark.move !== undefined)
  const carried =
    Icon === undefined
      ? undefined
      : (ofView: AssetView) => (
          <g transform={carriedMatrixOf(ofView, shape)}>
            <svg
              x={0}
              y={0}
              width={carriedSideOf(shape)}
              height={carriedSideOf(shape)}
              viewBox="0 0 24 24"
              aria-hidden
              className="overflow-visible"
            >
              <Icon progress={progress} stroke={stroke} />
            </svg>
          </g>
        )
  // The icon rides the face of the board: before its faces from the side it shows, behind them
  // from the side it hides, so that the sheet stands between the one that looks and it.
  const isShowing = turnedOf(boardFace, seenFrom).z >= 0
  return (
    <AssetFrame
      className={className}
      bounds={boundsOf[shape]}
      progress={progress}
      view={seenFrom}
      animated={hasMovingMarks}
      draw={(at, from) => boardOf(at, from, shape, onIt)}
      under={carried === undefined || isShowing ? undefined : carried}
      over={carried === undefined || !isShowing ? undefined : carried}
    />
  )
}

/** The room each shape of a board takes, as measured at the default view. */
const boundsOf = {
  sheet: assetBounds.board,
  square: assetBounds.boardSquare,
  panel: assetBounds.boardPanel,
  banner: assetBounds.boardBanner,
} as const

/** The faces of a board at a point of its clock under a view, farthest first. */
function boardOf(
  progress: number,
  view: AssetView,
  shape: BoardShape,
  marks: readonly BoardMark[],
): readonly DrawnPlate[] {
  return assetOf(boardPlatesOf(shape, marks, progress), view)
}
