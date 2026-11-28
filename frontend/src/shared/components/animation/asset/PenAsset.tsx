'use client'

import type { DrawnIconProps } from '../icon/icon.types'
import { assetBounds, defaultAssetView } from './asset.constants'
import type { AssetPlate, AssetView, DrawnPlate, Vec3 } from './asset.types'
import { AssetFrame } from './AssetFrame'
import { assetOf } from './draw/asset.utils'
import { rodOf, taperOf } from './draw/shape.utils'
import { turnedAbout } from './draw/turn.utils'

/** The pen as a faceted rod: how long its barrel is, how thick, how many flat sides it is cut into, and how long its tip runs out from the barrel. */
const pen = { length: 13, radius: 1.15, sides: 6, tip: 2.6 }

/** The writing of the pen: how many times its point goes across its line while the round goes, how far the point goes to each side of the line, and how far the body leans behind the point as it changes its way, in degrees. */
const writing = { strokes: 4, reach: 1.6, lean: 8 }

/** How the corners of its sides are set around the pen at rest: one flat side of it lying on top, one on the plane. */
const rest = -30

/** What a pen takes beyond what every icon drawn by a clock takes: whether it writes. */
export type PenProps = DrawnIconProps & {
  /** Whether the pen writes, its point going to and fro across its line while its body leans behind it; the pen lies still when it does not. */
  writing?: boolean | undefined
}

/**
 * A pen drawn as an asset: a rod of flat sides, lying on the plane of the frame, its sides shaded
 * one after another as a cylinder would be, running out into a tip of as many flat slopes. When
 * it writes, its point goes to and fro across its line, the body leaning behind the point as it
 * changes its way, as a pen in a hand does; when it does not, the pen lies still where it is.
 */
export function PenAsset({ progress, className, view, writing: isWriting = true }: PenProps) {
  return (
    <AssetFrame
      className={className}
      bounds={assetBounds.pen}
      progress={progress}
      view={view ?? defaultAssetView}
      animated={isWriting}
      draw={(at, seenFrom) => penOf(at, seenFrom, isWriting)}
    />
  )
}

/** The span of the ring of the rod at rest: one flat side of it lying on top, one on the plane. */
const span: readonly [Vec3, Vec3] = [
  { x: 0, y: Math.cos((rest * Math.PI) / 180), z: Math.sin((rest * Math.PI) / 180) },
  { x: 0, y: -Math.sin((rest * Math.PI) / 180), z: Math.cos((rest * Math.PI) / 180) },
]

/** The faces of the pen at a point of its clock under a view, farthest first. */
function penOf(progress: number, view: AssetView, isWriting: boolean): readonly DrawnPlate[] {
  const round = isWriting ? 2 * Math.PI * writing.strokes * progress : 0
  const slide = isWriting ? writing.reach * Math.sin(round) : 0
  const lean = isWriting ? writing.lean * Math.cos(round) : 0
  // The pen is one straight thing, lying on the plane of the frame with its point on its axis:
  // as it writes, it turns about the line through its point and the whole of it goes where the
  // point goes, so the tip never stands off the axis of the barrel, as a pen in a hand does.
  const point: Vec3 = { x: pen.length / 2 + pen.tip, y: pen.radius, z: 0 }
  const planted = (corner: Vec3): Vec3 => {
    const turned = turnedAbout(corner, { origin: point, direction: { x: 0, y: 1, z: 0 } }, lean)
    return { x: turned.x, y: turned.y, z: turned.z + slide }
  }
  const turned = (plates: readonly AssetPlate[]): readonly AssetPlate[] =>
    plates.map((plate) => ({ ...plate, corners: plate.corners.map(planted) }))
  const plates: readonly AssetPlate[] = [
    // The barrel: a rod of flat sides, lying on the plane of the frame.
    ...turned(
      rodOf({
        radius: pen.radius,
        height: pen.length,
        count: pen.sides,
        center: { x: 0, y: pen.radius, z: 0 },
        span,
        face: 'a',
        caps: 'back',
      }),
    ),
    // The tip: as many flat slopes as the barrel has sides, run out to its point on the axis.
    ...turned(
      taperOf({
        radius: pen.radius,
        count: pen.sides,
        center: { x: pen.length / 2, y: pen.radius, z: 0 },
        span,
        to: point,
        face: 'b',
      }),
    ),
  ]
  return assetOf(plates, view)
}
