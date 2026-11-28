import type { AssetPlate, PlateSpec, Vec3 } from '../asset.types'
import { turnedAbout } from './turn.utils'
import { crossOf, normalize } from './vec.utils'

/** The corners of a rectangle on a plane, from one corner of it to the other, placed by the plane's own way of laying a point: the sheet, the face and the block that the assets are built of. */
export function rectCornersOf(
  place: (across: number, upAlong: number) => Vec3,
  from: readonly [number, number],
  to: readonly [number, number],
): readonly Vec3[] {
  return [
    place(from[0], from[1]),
    place(to[0], from[1]),
    place(to[0], to[1]),
    place(from[0], to[1]),
  ]
}

/** The corners of a disc of a radius, as a polygon of a count of sides, in the plane through a middle that two axes span: the disc of a globe, a wheel, a ring. The disc starts at `from` degrees and goes as far as `sweep`, a whole turn when none is given. */
export function discCornersOf({
  radius,
  count,
  center,
  span,
  from = 0,
  sweep = 360,
}: {
  radius: number
  count: number
  center: Vec3
  span: readonly [Vec3, Vec3]
  from?: number | undefined
  sweep?: number | undefined
}): readonly Vec3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((from + (index / count) * sweep) * Math.PI) / 180
    const cos = Math.cos(angle) * radius
    const sin = Math.sin(angle) * radius
    return {
      x: center.x + span[0].x * cos + span[1].x * sin,
      y: center.y + span[0].y * cos + span[1].y * sin,
      z: center.z + span[0].z * cos + span[1].z * sin,
    }
  })
}

/** The plates of a tube: a hollow cylinder of a radius and a height, open at both ends, standing in the plane that two axes span. A ring drawn as a tube keeps its height from its side, where a flat ring goes to a line. */
export function tubeOf({
  radius,
  height,
  count,
  center,
  span,
  face,
}: {
  radius: number
  height: number
  count: number
  center: Vec3
  span: readonly [Vec3, Vec3]
  face: 'a' | 'b'
}): readonly AssetPlate[] {
  const way = normalize(crossOf(span[0], span[1]))
  const edge = (off: number): readonly Vec3[] =>
    discCornersOf({
      radius,
      count,
      center: {
        x: center.x + way.x * off,
        y: center.y + way.y * off,
        z: center.z + way.z * off,
      },
      span,
    })
  const belowCenter: Vec3 = {
    x: center.x - way.x * (height / 2),
    y: center.y - way.y * (height / 2),
    z: center.z - way.z * (height / 2),
  }
  const aboveCenter: Vec3 = {
    x: center.x + way.x * (height / 2),
    y: center.y + way.y * (height / 2),
    z: center.z + way.z * (height / 2),
  }
  const below = edge(-height / 2)
  const above = edge(height / 2)
  return Array.from({ length: count }, (_, index) => {
    const next = (index + 1) % count
    const nowhere: Vec3 = { x: center.x, y: center.y, z: center.z }
    return {
      corners: [
        below[index] ?? nowhere,
        below[next] ?? nowhere,
        above[next] ?? nowhere,
        above[index] ?? nowhere,
      ],
      face,
      bulge: { first: belowCenter, second: aboveCenter },
    }
  })
}

/** At each corner of a loop, for a given softness: where the curve of the corner begins on the edge coming in and on the edge going out. */
export function softCornersOf(
  corners: readonly Vec3[],
  soft: number,
): readonly { incoming: Vec3; outgoing: Vec3 }[] {
  return corners.map((corner, index) => {
    const previous = corners[(index - 1 + corners.length) % corners.length] ?? corner
    const next = corners[(index + 1) % corners.length] ?? corner
    const step = (to: Vec3): number =>
      Math.min(soft, Math.hypot(to.x - corner.x, to.y - corner.y, to.z - corner.z) / 2)
    const along = (to: Vec3): Vec3 => {
      const reach = step(to)
      const dx = to.x - corner.x
      const dy = to.y - corner.y
      const dz = to.z - corner.z
      const length = Math.hypot(dx, dy, dz)
      return length === 0
        ? corner
        : {
            x: corner.x + (dx / length) * reach,
            y: corner.y + (dy / length) * reach,
            z: corner.z + (dz / length) * reach,
          }
    }
    return { incoming: along(previous), outgoing: along(next) }
  })
}

/** The way straight out from a middle of a ring to a corner on it. */
export function radialOf(corner: Vec3, middle: Vec3): Vec3 {
  return normalize({
    x: corner.x - middle.x,
    y: corner.y - middle.y,
    z: corner.z - middle.z,
  })
}

/** The middle of the arc a soft corner runs along: out from the corner along the bisector of its two edges, as far as the arc needs to touch both of them. */
export function arcCenterOf(corner: Vec3, incoming: Vec3, outgoing: Vec3): Vec3 {
  const away = (point: Vec3): Vec3 => {
    const dx = point.x - corner.x
    const dy = point.y - corner.y
    const dz = point.z - corner.z
    const length = Math.hypot(dx, dy, dz)
    return length === 0 ? { x: 0, y: 0, z: 0 } : { x: dx / length, y: dy / length, z: dz / length }
  }
  const first = away(incoming)
  const second = away(outgoing)
  const bis = { x: first.x + second.x, y: first.y + second.y, z: first.z + second.z }
  const length = Math.hypot(bis.x, bis.y, bis.z)
  if (length === 0) return corner
  const unit = { x: bis.x / length, y: bis.y / length, z: bis.z / length }
  const touch = first.x * unit.x + first.y * unit.y + first.z * unit.z
  if (touch <= 0) return corner
  const reach = Math.hypot(incoming.x - corner.x, incoming.y - corner.y, incoming.z - corner.z)
  return {
    x: corner.x + unit.x * (reach / touch),
    y: corner.y + unit.y * (reach / touch),
    z: corner.z + unit.z * (reach / touch),
  }
}

/** The plates of a solid rod of flat sides: a flat wall for each pair of edges beside one another, with a cap on the ends it says, standing in the plane that two axes span. Where a tube runs smooth around, a rod shows its sides, each shaded its own way: the barrel of a pen, a column, a battery. */
export function rodOf({
  radius,
  height,
  count,
  center,
  span,
  face,
  caps = 'both',
}: {
  radius: number
  height: number
  count: number
  center: Vec3
  span: readonly [Vec3, Vec3]
  face: 'a' | 'b'
  /** Which of its ends carry a cap: both, for a rod that stands alone; the back or the front only, where something else closes the other end, as the taper of a pen closes it; neither, for a rod seen within something. */
  caps?: 'both' | 'back' | 'front' | 'neither'
}): readonly AssetPlate[] {
  const way = normalize(crossOf(span[0], span[1]))
  const ringAt = (off: number): readonly Vec3[] =>
    discCornersOf({
      radius,
      count,
      center: {
        x: center.x + way.x * off,
        y: center.y + way.y * off,
        z: center.z + way.z * off,
      },
      span,
    })
  const below = ringAt(-height / 2)
  const above = ringAt(height / 2)
  const capAt = (ring: readonly Vec3[]): AssetPlate => ({ corners: ring, face })
  return [
    ...Array.from({ length: count }, (_, index): AssetPlate => {
      const next = (index + 1) % count
      return {
        corners: [
          below[index] ?? center,
          below[next] ?? center,
          above[next] ?? center,
          above[index] ?? center,
        ],
        face,
      }
    }),
    ...(caps === 'both' || caps === 'back' ? [capAt([...below].reverse())] : []),
    ...(caps === 'both' || caps === 'front' ? [capAt(above)] : []),
  ]
}

/** The plates of a taper: one flat slope for each side of the ring it runs out from, all meeting at a point. The tip of a pen, the nose of a rocket. */
export function taperOf({
  radius,
  count,
  center,
  span,
  to,
  face,
}: {
  radius: number
  count: number
  center: Vec3
  span: readonly [Vec3, Vec3]
  /** The point the slopes meet at. */
  to: Vec3
  face: 'a' | 'b'
}): readonly AssetPlate[] {
  return discCornersOf({ radius, count, center, span }).map((corner, index, ring) => ({
    corners: [corner, ring[(index + 1) % count] ?? corner, to],
    face,
  }))
}

/** The plate that a telling of it in data stands for: a sheet, a disc or a shape of given corners, in the tone it is told with, turned as a whole when it says so. */
export function plateOfSpec(spec: PlateSpec): AssetPlate {
  let corners: readonly Vec3[]
  if ('box' in spec) {
    const { at, across, up } = spec.box
    corners = rectCornersOf(
      (along, upAlong) => ({
        x: at.x + across.x * along + up.x * upAlong,
        y: at.y + across.y * along + up.y * upAlong,
        z: at.z + across.z * along + up.z * upAlong,
      }),
      [0, 0],
      [1, 1],
    )
  } else if ('disc' in spec) {
    corners = discCornersOf({
      radius: spec.disc.radius,
      count: 24,
      center: spec.disc.at,
      span: [spec.disc.across, spec.disc.up],
    })
    if (spec.disc.inner !== undefined) {
      return {
        corners,
        inner: discCornersOf({
          radius: spec.disc.inner,
          count: 24,
          center: spec.disc.at,
          span: [spec.disc.across, spec.disc.up],
        }),
        face: spec.face,
        thickness: spec.thickness,
        soft: spec.soft,
        shade: spec.shade,
        opacity: spec.opacity,
        glow: spec.glow,
        round: true,
      }
    }
  } else {
    corners = spec.poly.corners
  }
  const inner = 'poly' in spec ? spec.poly.inner : undefined
  const turn = spec.turn
  if (turn !== undefined) {
    corners = corners.map((corner) =>
      turnedAbout(corner, { origin: turn.about, direction: turn.along }, turn.by),
    )
  }
  const turnedInner =
    inner !== undefined && turn !== undefined
      ? inner.map((corner) =>
          turnedAbout(corner, { origin: turn.about, direction: turn.along }, turn.by),
        )
      : inner
  return {
    corners,
    inner: turnedInner,
    face: spec.face,
    thickness: spec.thickness,
    soft: spec.soft,
    shade: spec.shade,
    opacity: spec.opacity,
    glow: spec.glow,
    round: 'disc' in spec,
  }
}
