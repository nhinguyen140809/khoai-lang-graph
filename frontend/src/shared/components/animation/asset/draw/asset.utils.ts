import type { AssetPlate, AssetView, DrawnPlate, Vec3 } from '../asset.types'
import { drawnOutlineOf, facesOf } from './faces.utils'
import { placed } from './outline.utils'
import { fillOf, litOf, normalOf } from './shade.utils'
import { turnedOf } from './turn.utils'

/**
 * The faces of the plates of an asset, farthest first so that the nearer ones cover them, at one
 * point of its clock under one view. A plate of some thickness is drawn as a closed box, its
 * front with a thin band and a back behind it; one of none, as a sheet of paper. Faces asked to
 * fade by their distance are mixed toward `into`, the color of the background as it is given,
 * the more they lie behind the front of the asset, so that the near side of it stands out over
 * its far side.
 */
export function assetOf(
  plates: readonly AssetPlate[],
  view: AssetView,
  fade = 0,
  into = 'var(--background)',
): DrawnPlate[] {
  const drawn = plates
    .flatMap((plate) => facesOf(plate))
    .map((face) => {
      const turned = face.corners.map((corner) => turnedOf(corner, view))
      // For the wall of a tube or a ring, the run of its fill: the middles of its two ends,
      // each in the color that end faces the light with.
      const beside = (a: Vec3 | undefined, b: Vec3 | undefined): Vec3 => ({
        x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2,
        y: ((a?.y ?? 0) + (b?.y ?? 0)) / 2,
        z: ((a?.z ?? 0) + (b?.z ?? 0)) / 2,
      })
      const spread =
        face.shadeAlong === undefined
          ? undefined
          : {
              from: placed(beside(face.corners[1], face.corners[2]), view),
              to: placed(beside(face.corners[3], face.corners[0]), view),
              fills: [
                fillOf(face.face, litOf(face.shadeAlong.from, view), face.shade, face.opacity),
                fillOf(face.face, litOf(face.shadeAlong.to, view), face.shade, face.opacity),
              ] as const,
            }
      const depth = turned.reduce((total, corner) => total + corner.z, 0) / turned.length
      return {
        depth,
        d: drawnOutlineOf(face, view),
        fill: fillOf(
          face.face,
          face.glow ? 1 : litOf(normalOf(face.corners), view),
          face.shade,
          face.opacity,
        ),
        spread,
      }
    })
    .sort((a, b) => a.depth - b.depth)
  // The span the fade runs over is the deepest and the nearest face of the asset by their own
  // depths.
  const far = Math.min(...drawn.map((face) => face.depth))
  const near = Math.max(...drawn.map((face) => face.depth))
  return drawn.map(({ depth, d, fill, spread }) => {
    if (fade <= 0 || near <= far) return { d, fill, spread }
    const share = Math.round((1 - fade * ((near - depth) / (near - far))) * 100)
    if (share >= 100) return { d, fill, spread }
    const into2 = (color: string) => `color-mix(in oklch, ${color} ${String(share)}%, ${into})`
    return {
      d,
      fill: into2(fill),
      spread:
        spread === undefined
          ? undefined
          : { ...spread, fills: [into2(spread.fills[0]), into2(spread.fills[1])] },
    }
  })
}
