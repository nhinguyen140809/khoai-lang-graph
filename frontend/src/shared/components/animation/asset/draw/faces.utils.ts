import type { AssetPlate, AssetView, Vec3 } from '../asset.types'
import { bulgingOf, ellipseOf, pathOf, roundedOf } from './outline.utils'
import { normalOf } from './shade.utils'
import { arcCenterOf, radialOf, softCornersOf } from './shape.utils'

/** One drawable face of a plate, with the color, the shade, the light of its own, if any, the see-through of the plate it comes from, the hole it carries if it is a ring, and whether it is drawn as the true curve of its circle or with the bulged ends of the walls of one. */
interface AssetFace {
  corners: readonly Vec3[]
  inner?: readonly Vec3[] | undefined
  face: 'a' | 'b'
  shade: number
  glow: boolean
  opacity: number
  round: boolean
  soft?: number | undefined
  bulge?: { first: Vec3; second: Vec3 } | undefined
  shadeAlong?: { from: Vec3; to: Vec3 } | undefined
}

/** The faces a plate is drawn as: its front, and when it has thickness, a closed box of its back and a band of its sides around it, a ring with walls within as well as without, each face carrying the color and the shade of its plate. */
export function facesOf(plate: AssetPlate): readonly AssetFace[] {
  const front: AssetFace = {
    corners: plate.corners,
    inner: plate.inner,
    face: plate.face,
    shade: plate.shade ?? 0,
    glow: plate.glow ?? false,
    opacity: plate.opacity ?? 1,
    round: plate.round ?? false,
    soft: plate.soft,
    bulge: plate.bulge,
    shadeAlong: plate.shadeAlong,
  }
  const thickness = plate.thickness ?? 0
  if (thickness <= 0) return [front]
  const normal = normalOf(plate.corners)
  const behind = (loop: readonly Vec3[]): readonly Vec3[] =>
    loop.map((corner) => ({
      x: corner.x - normal.x * thickness,
      y: corner.y - normal.y * thickness,
      z: corner.z - normal.z * thickness,
    }))
  const back = behind(plate.corners)
  // The middles of the circles a loop of corners and its copy behind lie on.
  const middleOf = (loop: readonly Vec3[]): Vec3 =>
    loop.reduce(
      (sum, corner) => ({
        x: sum.x + corner.x / loop.length,
        y: sum.y + corner.y / loop.length,
        z: sum.z + corner.z / loop.length,
      }),
      { x: 0, y: 0, z: 0 },
    )
  const wall = (loop: readonly Vec3[], backLoop: readonly Vec3[], index: number) => {
    const corner = loop[index]
    const next = loop[(index + 1) % loop.length]
    if (corner === undefined || next === undefined) return []
    return [
      {
        corners: [
          next,
          corner,
          backLoop[index] ?? corner,
          backLoop[(index + 1) % backLoop.length] ?? next,
        ],
        face: plate.face,
        shade: front.shade,
        glow: front.glow,
        round: false,
        bulge: front.round ? { first: middleOf(loop), second: middleOf(backLoop) } : undefined,
        shadeAlong:
          plate.round === true
            ? { from: radialOf(corner, middleOf(loop)), to: radialOf(next, middleOf(loop)) }
            : undefined,
        opacity: front.opacity,
      },
    ]
  }
  if (plate.soft !== undefined) {
    // The walls of a plate with soft corners: a wall along each edge between the bends at its
    // two ends, and a wall across each bend, all straight, the corners themselves carrying no
    // more than the curve of the faces.
    const bends = softCornersOf(plate.corners, plate.soft)
    const between = (from: Vec3, to: Vec3): AssetFace => ({
      corners: [from, to, behind([to])[0] ?? to, behind([from])[0] ?? from],
      face: plate.face,
      shade: front.shade,
      glow: front.glow,
      opacity: front.opacity,
      round: false,
    })
    return [
      ...plate.corners.flatMap((corner, index) => {
        const bend = bends[index] ?? {
          incoming: corner,
          outgoing: corner,
        }
        const next = bends[(index + 1) % bends.length] ?? bend
        // The wall across the bend, its edge curved along the same arc the faces take at the
        // corner, so that the two meet without a step.
        const arc = arcCenterOf(corner, bend.incoming, bend.outgoing)
        const behindArc = {
          x: arc.x - normal.x * thickness,
          y: arc.y - normal.y * thickness,
          z: arc.z - normal.z * thickness,
        }
        const across: AssetFace = {
          corners: [
            bend.incoming,
            bend.outgoing,
            behind([bend.outgoing])[0] ?? bend.outgoing,
            behind([bend.incoming])[0] ?? bend.incoming,
          ],
          face: plate.face,
          shade: front.shade,
          glow: front.glow,
          opacity: front.opacity,
          round: false,
          bulge: { first: arc, second: behindArc },
        }
        return [between(bend.outgoing, next.incoming), across]
      }),
      { ...front, corners: [...back].reverse(), soft: plate.soft },
      front,
    ]
  }
  if (plate.inner === undefined) {
    const sides = plate.corners.flatMap((_, index) => wall(plate.corners, back, index))
    // The back closes the box, wound the other way, so that the plate reads as a solid thing
    // from whichever side it is seen from.
    const rear: AssetFace = {
      corners: [...back].reverse(),
      face: plate.face,
      shade: front.shade,
      glow: front.glow,
      opacity: front.opacity,
      round: front.round,
    }
    return [...sides, rear, front]
  }
  // A ring of some thickness: walls within as well as without, and its front and its back each
  // drawn as one segment per wall, curved along its two circles, so that no face of the ring
  // covers more than one span of it: a whole front, drawn as one face, is measured at the middle
  // of the ring, and the walls nearest the viewer then draw over it, as if the ring were hollow.
  const backInner = behind(plate.inner ?? [])
  const outerWalls = plate.corners.flatMap((_, index) => wall(plate.corners, back, index))
  const innerWalls = plate.inner.flatMap((_, index) => wall(plate.inner ?? [], backInner, index))
  const inner = plate.inner ?? []
  const center = middleOf(plate.corners)
  const segment = (corners: readonly Vec3[]): AssetFace => ({
    corners,
    face: plate.face,
    shade: front.shade,
    glow: front.glow,
    opacity: front.opacity,
    round: false,
    // A ring of a disc curves its segments along its circle; a frame of straight corners, like
    // the bezel of a laptop around its display, has flat ones.
    bulge: front.round ? { first: center, second: center } : undefined,
  })
  const frontSegments = plate.corners.map((corner, index) => {
    const next = plate.corners[(index + 1) % plate.corners.length] ?? corner
    return segment([
      corner,
      next,
      inner[(index + 1) % inner.length] ?? corner,
      inner[index] ?? corner,
    ])
  })
  const rearSegments = back.map((corner, index) => {
    const next = back[(index + 1) % back.length] ?? corner
    return segment([
      backInner[index] ?? corner,
      backInner[(index + 1) % backInner.length] ?? next,
      next,
      corner,
    ])
  })
  return [...outerWalls, ...innerWalls, ...rearSegments, ...frontSegments]
}

/** The outline of a face of an asset, by the shape of it: bulged at its ends when it is the wall of a tube, a true curve when it is a disc, and the straight run of its corners the rest of the time. */
export function drawnOutlineOf(face: AssetFace, view: AssetView): string {
  if (face.bulge !== undefined) return bulgingOf(face.corners, view, face.bulge)
  if (face.round) return ellipseOf(face.corners, view, face.inner)
  if (face.soft !== undefined) return roundedOf(face.corners, view, face.soft, face.inner)
  return pathOf(face.corners, view, face.inner)
}
