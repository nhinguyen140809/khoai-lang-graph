import type { AssetView, Vec3 } from '../asset.types'
import { softCornersOf } from './shape.utils'
import { turnedOf } from './turn.utils'

function fixed(value: number): number {
  return Math.round(value * 100) / 100
}

/** A point of the geometry laid on the frame. */
export function placed(point: Vec3, view: AssetView): { x: number; y: number } {
  const turned = turnedOf(point, view)
  return { x: 12 + turned.x, y: 12 - turned.y }
}

/** A point of the geometry laid on the frame, as the words of a path. */
function placedText(point: Vec3, view: AssetView): string {
  const turned = turnedOf(point, view)
  return `${String(fixed(12 + turned.x))} ${String(fixed(12 - turned.y))}`
}

/** The outline of a face of an asset on its 24 by 24 frame, seen from the view: its corners turned and laid on the frame, its up to the top of the frame. The hole of a ring is drawn within it, as a second outline inside the first. */
export function pathOf(corners: readonly Vec3[], view: AssetView, inner?: readonly Vec3[]): string {
  const outline = (loop: readonly Vec3[], start: string) =>
    `${loop
      .map((corner, index) => `${index === 0 ? start : 'L'}${placedText(corner, view)}`)
      .join('')}Z`
  return inner === undefined
    ? outline(corners, 'M')
    : `${outline(corners, 'M')}${outline(inner, 'M')}`
}

/**
 * The outline of a disc, drawn as the true curve it is: its corners stand at the quarters of its
 * circle, and the circle comes out under the view as an ellipse, drawn as arcs. The hole of a
 * ring is drawn within it, as a second curve inside the first.
 */
export function ellipseOf(
  corners: readonly Vec3[],
  view: AssetView,
  inner?: readonly Vec3[],
): string {
  const loop = (pts: readonly Vec3[]): string => {
    const middle = placed(
      pts.reduce(
        (sum, corner) => ({
          x: sum.x + corner.x / pts.length,
          y: sum.y + corner.y / pts.length,
          z: sum.z + corner.z / pts.length,
        }),
        { x: 0, y: 0, z: 0 },
      ),
      view,
    )
    const quarter = placed(pts[pts.length / 4] ?? pts[0] ?? { x: 0, y: 0, z: 0 }, view)
    const firstPoint = placed(pts[0] ?? { x: 0, y: 0, z: 0 }, view)
    const a = {
      x: firstPoint.x - middle.x,
      y: firstPoint.y - middle.y,
    }
    const b = { x: quarter.x - middle.x, y: quarter.y - middle.y }
    // The ellipse as the sum of the outer products of its two conjugate radii, and the wide and
    // the narrow axis of it from the eigenvalues of that sum: the same whichever pair of its
    // quarters the corners stand at, so the two circles of one rim come out parallel under one
    // view.
    const wideSquare = a.x * a.x + b.x * b.x
    const narrowSquare = a.y * a.y + b.y * b.y
    const between = a.x * a.y + b.x * b.y
    const trace = wideSquare + narrowSquare
    const root = Math.sqrt(
      Math.max(0, (trace / 2) ** 2 - (wideSquare * narrowSquare - between * between)),
    )
    const first = trace / 2 + root
    const second = trace / 2 - root
    let way = { x: first - narrowSquare, y: between }
    if (way.x === 0 && way.y === 0) way = { x: between, y: first - wideSquare }
    if (way.x === 0 && way.y === 0)
      way = wideSquare >= narrowSquare ? { x: 1, y: 0 } : { x: 0, y: 1 }
    const length = Math.hypot(way.x, way.y)
    const across = Math.sqrt(Math.max(first, 0))
    const along = Math.sqrt(Math.max(second, 0))
    const turn = (Math.atan2(way.y, way.x) * 180) / Math.PI
    const one = {
      x: middle.x + (way.x / length) * across,
      y: middle.y + (way.y / length) * across,
    }
    const other = {
      x: middle.x - (way.x / length) * across,
      y: middle.y - (way.y / length) * across,
    }
    const arcs = `${String(fixed(across))} ${String(fixed(along))} ${String(fixed(turn))}`
    return `M${String(fixed(one.x))} ${String(fixed(one.y))}A${arcs} 1 1 ${String(fixed(other.x))} ${String(fixed(other.y))}A${arcs} 1 1 ${String(fixed(one.x))} ${String(fixed(one.y))}Z`
  }
  return inner === undefined ? loop(corners) : `${loop(corners)}${loop(inner)}`
}

/**
 * The outline of a wall between two circles, its two ends bulging out to the true curve of the
 * circles they run along: the corner points of each end stand on its circle, and the edge
 * between them is drawn as a curve through the point where the circle's own tangent lines meet.
 */
export function bulgingOf(
  corners: readonly Vec3[],
  view: AssetView,
  bulge: { first: Vec3; second: Vec3 },
): string {
  const aside = (from: Vec3, to: Vec3, middle: Vec3): Vec3 => {
    const half = {
      x: (from.x + to.x) / 2 - middle.x,
      y: (from.y + to.y) / 2 - middle.y,
      z: (from.z + to.z) / 2 - middle.z,
    }
    const reach = half.x * half.x + half.y * half.y + half.z * half.z
    if (reach === 0) return to
    const radius2 = (from.x - middle.x) ** 2 + (from.y - middle.y) ** 2 + (from.z - middle.z) ** 2
    return {
      x: middle.x + (half.x * radius2) / reach,
      y: middle.y + (half.y * radius2) / reach,
      z: middle.z + (half.z * radius2) / reach,
    }
  }
  const [first, second, third, fourth] = corners
  if (first === undefined || second === undefined || third === undefined || fourth === undefined)
    return pathOf(corners, view)
  return `M${placedText(first, view)}Q${placedText(aside(first, second, bulge.first), view)} ${placedText(second, view)}L${placedText(third, view)}Q${placedText(aside(third, fourth, bulge.second), view)} ${placedText(fourth, view)}Z`
}

/**
 * The outline of a plate with soft corners, drawn as true curves: at each corner, the outline
 * runs straight to where its curve begins, then bends around the corner through it, as a rounded
 * corner of a message bubble is. The hole of a ring is drawn within it, in the same way.
 */
export function roundedOf(
  corners: readonly Vec3[],
  view: AssetView,
  soft: number,
  inner?: readonly Vec3[],
): string {
  const loop = (pts: readonly Vec3[]): string => {
    const bends = softCornersOf(pts, soft)
    if (bends.length === 0) return pathOf(pts, view)
    const run = pts
      .map((corner, index) => {
        const bend = bends[index] ?? { incoming: corner, outgoing: corner }
        return index === 0
          ? `M${placedText(bend.outgoing, view)}`
          : `L${placedText(bend.incoming, view)}Q${placedText(corner, view)} ${placedText(bend.outgoing, view)}`
      })
      .join('')
    const close = bends[0]
    const first = pts[0] ?? { x: 0, y: 0, z: 0 }
    const last =
      close === undefined
        ? ''
        : `L${placedText(close.incoming, view)}Q${placedText(first, view)} ${placedText(close.outgoing, view)}`
    return `${run}${last}Z`
  }
  return inner === undefined ? loop(corners) : `${loop(corners)}${loop(inner)}`
}
