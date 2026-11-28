'use client'

import type { ComponentType } from 'react'

import type { DrawnIconProps } from '../icon/icon.types'
import { defaultAssetView } from './asset.constants'
import type { AssetSpec } from './asset.types'
import { AssetFrame } from './AssetFrame'
import { Board } from './boards/Board'
import type { BoardMark, BoardShape } from './boards/board.types'
import { assetOf } from './draw/asset.utils'
import { plateOfSpec } from './draw/shape.utils'

/**
 * An icon of an asset told as data: its plates, each told as a sheet, a disc or a shape of given
 * corners in a tone, drawn by the frame of the assets like any other. It stands still over its
 * clock, for a thing that moves with it is told in code.
 */
export function assetIconOf(spec: AssetSpec): ComponentType<DrawnIconProps> {
  function SpecIcon({ progress, className, view }: DrawnIconProps) {
    return (
      <AssetFrame
        className={className}
        bounds={spec.bounds}
        progress={progress}
        view={view ?? defaultAssetView}
        draw={(_at, seenFrom) => assetOf(spec.plates.map(plateOfSpec), seenFrom, spec.fade)}
      />
    )
  }
  return SpecIcon
}

/**
 * A board told as data: the sheet of one of its shapes with marks on it, drawn like any other
 * asset. It stands still over its clock unless one of its marks says how it moves, and then the
 * marks move as the point of the clock has come to them.
 */
export function boardAssetOf(
  shape: BoardShape,
  marks: readonly BoardMark[],
): ComponentType<DrawnIconProps> {
  function SpecBoard({ progress, className, view }: DrawnIconProps) {
    return (
      <Board
        className={className}
        progress={progress}
        view={view ?? defaultAssetView}
        shape={shape}
        marks={marks}
      />
    )
  }
  return SpecBoard
}
