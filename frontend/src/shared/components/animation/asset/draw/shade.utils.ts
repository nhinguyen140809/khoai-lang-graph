import type { AssetView, Vec3 } from '../asset.types'
import { turnedOf } from './turn.utils'
import { dotOf, normalize } from './vec.utils'

/** The light of the icons that are drawn as assets, as it stands on the screen: from above, a little to the left and a little toward the viewer, as the light of a face is. */
const light = normalize({ x: -0.4, y: 0.55, z: 0.73 })

/** The largest share of black that a face turned away from the light takes: the depth of an asset is painted, not lit, so no face of it ever goes dark. */
const darkest = 55

/** The way the front of a plate points, from its corners in order around it. */
export function normalOf(corners: readonly Vec3[]): Vec3 {
  let x = 0
  let y = 0
  let z = 0
  for (let index = 0; index < corners.length; index++) {
    const a = corners[index] ?? { x: 0, y: 0, z: 0 }
    const b = corners[(index + 1) % corners.length] ?? a
    x += (a.y - b.y) * (a.z + b.z)
    y += (a.z - b.z) * (a.x + b.x)
    z += (a.x - b.x) * (a.y + b.y)
  }
  return normalize({ x, y, z })
}

/** How much of the light a face takes, from none to all: a face that points away from the viewer is lit on its other side, as the back of a sheet of paper is. */
export function litOf(normal: Vec3, view: AssetView): number {
  const facing = turnedOf(normal, view)
  const side = facing.z < 0 ? { x: -facing.x, y: -facing.y, z: -facing.z } : facing
  return Math.max(0, dotOf(side, light))
}

/**
 * The fill of a face of an asset: the color of its plate, mixed toward black by how far it is
 * turned from the light and by the shade it was given, never past a share that keeps it a painted
 * shape. A translucent plate is mixed toward nothing for its share, so that what stands behind it
 * is seen through it.
 */
export function fillOf(color: 'a' | 'b', lit: number, shade: number, opacity = 1): string {
  const paint = color === 'a' ? 'var(--icon-a, currentColor)' : 'var(--icon-b, currentColor)'
  const black = Math.min(90, Math.round((1 - lit) * darkest + shade))
  const solid = black <= 0 ? paint : `color-mix(in oklch, ${paint}, black ${String(black)}%)`
  return opacity >= 1
    ? solid
    : `color-mix(in oklch, ${solid} ${String(Math.round(opacity * 100))}%, transparent)`
}
