'use client'

import type { DrawnIconProps } from '../icon/icon.types'
import { assetBounds, defaultAssetView } from './asset.constants'
import type { AssetPlate, AssetView, DrawnPlate } from './asset.types'
import { AssetFrame } from './AssetFrame'
import { assetOf } from './draw/asset.utils'
import { discCornersOf, tubeOf } from './draw/shape.utils'
import { unTurnedOf } from './draw/turn.utils'

/** The globe as a frame of tubes: how wide the whole sphere it lies on is, how tall each tube is, and how many flat sides a whole tube is drawn with. */
const globe = { radius: 6.3, height: 0.65, sides: 16 }

/** The sphere the frame lies on, as a translucent body: how much of it is seen through. */
const sphere = { seeThrough: 0.22 }

/** How far apart the meridians stand around the pole, in degrees, and at which latitude a parallel lies: the equator alone. */
const meridians = { apart: 60 }
const parallels = [0]

/** How many whole turns the globe makes about its pole over a round of its clock. */
const spin = { turns: 1 }

/** How far the far side of the globe fades into the color of the foreground, so that it stays as a ghost under the near side of the frame. */
const fade = 0.8

/**
 * A globe drawn as an asset: a frame of tubes standing on one sphere, the meridians crossing at
 * the poles and the equator lying flat between them, each tube a hollow cylinder, so that its
 * lines keep their height from every side they are seen from. The sphere itself is drawn as a
 * translucent body, a disc turned to face the one that looks, for the silhouette of a sphere is
 * a circle whichever way it is seen from, so the middle of the globe is not empty but the
 * faint pale color of the sphere, with the frame over it in the stronger color. The far
 * side of the frame fades into the foreground as a ghost
 * under the near side. It turns about its pole over the round, the meridians carried around.
 */
export function GlobeAsset({ progress, className, view }: DrawnIconProps) {
  return (
    <AssetFrame
      className={className}
      bounds={assetBounds.globe}
      progress={progress}
      view={view ?? defaultAssetView}
      animated
      draw={globeOf}
    />
  )
}

/** The faces of the globe at a point of its clock under a view, farthest first. */
function globeOf(progress: number, view: AssetView): readonly DrawnPlate[] {
  const turned = progress * spin.turns * Math.PI * 2
  const middle = { x: 0, y: 0, z: 0 }
  // The body of the sphere: a disc turned to face the one that looks, for the silhouette of a
  // sphere is a circle from every side, standing at the middle of the globe, behind the near
  // half of the frame and over the far one.
  const body: AssetPlate = {
    corners: discCornersOf({
      radius: globe.radius,
      count: globe.sides * 2,
      center: middle,
      span: [unTurnedOf({ x: 1, y: 0, z: 0 }, view), unTurnedOf({ x: 0, y: 1, z: 0 }, view)],
    }),
    face: 'b',
    opacity: sphere.seeThrough,
    round: true,
  }
  // A meridian, standing on the sphere at its own place around the pole, carried by the turn of the globe.
  const meridianPlates = Array.from({ length: 180 / meridians.apart }, (_, number) =>
    tubeOf({
      radius: globe.radius,
      height: globe.height,
      count: globe.sides,
      center: middle,
      span: [
        {
          x: Math.cos(turned + (number * meridians.apart * Math.PI) / 180),
          y: 0,
          z: Math.sin(turned + (number * meridians.apart * Math.PI) / 180),
        },
        { x: 0, y: 1, z: 0 },
      ],
      face: 'a',
    }),
  )
  // The equator, lying flat around them.
  const equatorPlates = parallels.map((latitude) =>
    tubeOf({
      radius: Math.cos((latitude * Math.PI) / 180) * globe.radius,
      height: globe.height,
      count: globe.sides,
      center: {
        x: 0,
        y: Math.sin((latitude * Math.PI) / 180) * globe.radius,
        z: 0,
      },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      face: 'a',
    }),
  )
  return assetOf(
    [body, ...meridianPlates, ...equatorPlates].flat(),
    view,
    fade,
    'var(--foreground)',
  )
}
