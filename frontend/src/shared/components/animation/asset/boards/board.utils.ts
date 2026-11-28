import { stretchOf } from '@/shared/lib/animation'

import type { AssetPlate, AssetView, PlateSpec, Vec3 } from '../asset.types'
import { plateOfSpec, rectCornersOf } from '../draw/shape.utils'
import { turnedOf } from '../draw/turn.utils'
import type {
  BoardLineMark,
  BoardMark,
  BoardMarkMove,
  BoardRectMark,
  BoardShape,
} from './board.types'
import { boardShapes } from './board.types'

/** How far a mark that slides is to the right of where it rests, at a point of the clock. */
const slidBy = (slide: { reach: number; phase: number }, progress: number) =>
  slide.reach * Math.sin((progress + slide.phase) * Math.PI * 2)

/** How long a mark that grows is, as a share of its full length, at a point of the clock. */
const grownTo = (phase: number, progress: number) =>
  0.6 + 0.4 * Math.abs(Math.sin((progress + phase) * Math.PI))

/** How seen a mark that drifts is, at how far up the board it stands: whole between the edges, fading before them. */
const seenBetween = (
  up: number,
  { bottom, top, fade }: { bottom: number; top: number; fade: number },
) => Math.min(1, Math.max(0, Math.min((up - bottom) / fade, (top - up) / fade)))

/** How a mark moves over the round, as an offset so far across and so far up the board; the rest of the moving is in the corners themselves. */
function movedBy(move: BoardMarkMove, progress: number): { across: number; up: number } {
  if ('slide' in move) return { across: slidBy(move.slide, progress), up: 0 }
  if ('cycle' in move) return { across: 0, up: move.cycle.by * progress }
  return { across: 0, up: 0 }
}

/** How much of a line is drawn, over how far the round has come: its points, cut at that share of its length. */
function revealedOf(
  points: readonly (readonly [number, number])[],
  share: number,
  width: number,
  height: number,
): readonly (readonly [number, number])[] {
  if (share >= 1) return points
  const toUnits = ([across, up]: readonly [number, number]) => ({
    x: (across - 0.5) * width,
    y: up * height,
  })
  const run = points.map(toUnits)
  let total = 0
  const spans: number[] = []
  for (let i = 1; i < run.length; i++) {
    const ahead = run[i] ?? { x: 0, y: 0 }
    const behind = run[i - 1] ?? { x: 0, y: 0 }
    const span = Math.hypot(ahead.x - behind.x, ahead.y - behind.y)
    spans.push(span)
    total += span
  }
  let left = total * share
  const out: (readonly [number, number])[] = [points[0] ?? [0, 0]]
  for (let i = 0; i < spans.length; i++) {
    const from = points[i] ?? [0, 0]
    const to = points[i + 1] ?? from
    const span = spans[i] ?? 0
    if (span <= left) {
      out.push(to)
      left -= span
    } else {
      const part = span === 0 ? 0 : left / span
      out.push([from[0] + (to[0] - from[0]) * part, from[1] + (to[1] - from[1]) * part])
      break
    }
  }
  return out
}

/** The corners of a line of a width through its points, so far across and so far up the board: a band as wide as the line, wound around it. */
function bandOf(
  points: readonly (readonly [number, number])[],
  widthShare: number,
  width: number,
  height: number,
): readonly (readonly [number, number])[] {
  const toUnits = ([across, up]: readonly [number, number]) => ({
    x: (across - 0.5) * width,
    y: up * height,
  })
  const toShares = ({ x, y }: { x: number; y: number }) => [x / width + 0.5, y / height] as const
  const run = points.map(toUnits)
  const half = (widthShare * height) / 2
  const beside = (i: number) => {
    const behind = run[Math.max(0, i - 1)] ?? { x: 0, y: 0 }
    const ahead = run[Math.min(run.length - 1, i + 1)] ?? { x: 0, y: 0 }
    const dx = ahead.x - behind.x
    const dy = ahead.y - behind.y
    const length = Math.hypot(dx, dy)
    if (length === 0) return { x: 0, y: 0 }
    return { x: -dy / length, y: dx / length }
  }
  const side = (sign: number) =>
    run.map((point, i) => {
      const n = beside(i)
      return toShares({ x: point.x + n.x * half * sign, y: point.y + n.y * half * sign })
    })
  return [...side(1), ...side(-1).reverse()]
}

/** How far up the board a mark stands, at its middle, so that the marks of one row drift together. */
function middleUpOf(mark: BoardMark): number {
  if ('dot' in mark) return mark.dot.at[1]
  if ('rect' in mark) return (mark.rect.from[1] + mark.rect.to[1]) / 2
  if ('line' in mark) {
    const ups = mark.line.points.map(([, up]) => up)
    return (Math.min(...ups) + Math.max(...ups)) / 2
  }
  const ups = mark.corners.map(([, up]) => up)
  return (Math.min(...ups) + Math.max(...ups)) / 2
}

/**
 * The plates a board is told as in data: the sheet itself, translucent so that what stands behind
 * it is seen through it, with the marks standing a little off its face, in shares of the width
 * and the height of its shape, so that one set of marks fits every shape a board comes in. A mark
 * that says how it moves is drawn as the point of the clock has come to it.
 */
function boardPlateSpecsOf(
  shape: BoardShape,
  marks: readonly BoardMark[],
  progress: number,
): readonly PlateSpec[] {
  const { width, height } = boardShapes[shape]
  const at = (across: number, upAlong: number): Vec3 =>
    boardAt((across - 0.5) * width, upAlong * height, boardLift)
  return [
    {
      poly: {
        corners: rectCornersOf(boardAt, [-width / 2, 0], [width / 2, height]),
      },
      face: 'a',
      opacity: board.seeThrough,
    },
    ...marks.map((mark): PlateSpec => {
      const move = mark.move
      const shifted = move !== undefined ? movedBy(move, progress) : { across: 0, up: 0 }
      if ('dot' in mark) {
        return {
          disc: {
            at: at(mark.dot.at[0] + shifted.across, mark.dot.at[1] + shifted.up),
            radius: mark.dot.radius * height,
            across: { x: 1, y: 0, z: 0 },
            up: boardUp,
          },
          ...toneOf(mark, progress),
        }
      }
      return {
        poly: {
          corners: cornersOf(mark, progress, width, height).map(([across, up]) =>
            at(across + shifted.across, up + shifted.up),
          ),
        },
        ...toneOf(mark, progress),
      }
    }),
  ]
}

/** The tone of a mark, as it moves over the round: its color, the light of its own, and how seen it is at the point of the clock. */
function toneOf(mark: BoardMark, progress: number) {
  const move = mark.move
  if (move === undefined) return { face: mark.face, glow: mark.glow }
  if ('appear' in move)
    return {
      face: mark.face,
      glow: mark.glow,
      opacity: stretchOf(progress, move.appear.from, move.appear.to),
    }
  if ('light' in move)
    return {
      face: mark.face,
      glow: mark.glow,
      opacity:
        0.35 + 0.65 * Math.sin(Math.PI * stretchOf(progress, move.light.from, move.light.to)),
    }
  if ('cycle' in move)
    return {
      face: mark.face,
      glow: mark.glow,
      opacity: seenBetween(middleUpOf(mark) + move.cycle.by * progress, move.cycle.within),
    }
  return { face: mark.face, glow: mark.glow }
}

/** The corners of a mark on the face of the board, so far across and so far up it, as the point of the clock has come to it: the verbs that reshape a mark work on its corners before they are placed. */
function cornersOf(
  mark: BoardMark,
  progress: number,
  width: number,
  height: number,
): readonly (readonly [number, number])[] {
  if ('rect' in mark) return rectCornersOfMark(mark, progress)
  if ('line' in mark) return lineCornersOfMark(mark, progress, width, height)
  return 'corners' in mark ? mark.corners : []
}

/** The corners of a rectangle, grown from one of its sides and drawn in from its start as the point of the clock has come to it. */
function rectCornersOfMark(
  mark: BoardRectMark,
  progress: number,
): readonly (readonly [number, number])[] {
  const move = mark.move
  const [x0, fromUp] = mark.rect.from
  const [x1, toUp] = mark.rect.to
  const grown = move !== undefined && 'grow' in move ? grownTo(move.grow.phase, progress) : 1
  // Grown from its foot, its head comes down to it; from its head, its foot rises to it.
  const y0 =
    move !== undefined && 'grow' in move && move.grow.from === 'head'
      ? fromUp + (toUp - fromUp) * (1 - grown)
      : fromUp
  const y1 =
    move !== undefined && 'grow' in move && move.grow.from === 'head'
      ? toUp
      : fromUp + (toUp - fromUp) * grown
  const wide =
    move !== undefined && 'reveal' in move
      ? x0 + (x1 - x0) * stretchOf(progress, move.reveal.from, move.reveal.to)
      : x1
  return [
    [x0, y0],
    [wide, y0],
    [wide, y1],
    [x0, y1],
  ]
}

/** The corners of a line, drawn in from its start over a stretch of the round, as a band as wide as it is. */
function lineCornersOfMark(
  mark: BoardLineMark,
  progress: number,
  width: number,
  height: number,
): readonly (readonly [number, number])[] {
  const move = mark.move
  const points =
    move !== undefined && 'reveal' in move
      ? revealedOf(
          mark.line.points,
          stretchOf(progress, move.reveal.from, move.reveal.to),
          width,
          height,
        )
      : mark.line.points
  return bandOf(points, mark.line.width, width, height)
}

/** How far a board leans back from standing straight, and how much of what stands behind it is seen through it. */
const board = { lean: 12, seeThrough: 0.35 }

/** How far what is drawn on a board stands off its face. */
export const boardLift = 0.08

const lean = (board.lean * Math.PI) / 180

/** The way up the plane of a board runs. */
const boardUp: Vec3 = { x: 0, y: Math.cos(lean), z: -Math.sin(lean) }

/** The way the front of a board points. */
export const boardFace: Vec3 = { x: 0, y: Math.sin(lean), z: Math.cos(lean) }

/** A point of the plane of a board: so far across and so far up it, standing so far off its face for what is drawn on it. */
export function boardAt(across: number, upAlong: number, off = 0): Vec3 {
  return {
    x: across,
    y: upAlong * boardUp.y + boardFace.y * off,
    z: upAlong * boardUp.z + boardFace.z * off,
  }
}

/** The plates of a board, ready for the kit to draw, as the point of its clock has come to them. */
export function boardPlatesOf(
  shape: BoardShape,
  marks: readonly BoardMark[],
  progress = 0,
): readonly AssetPlate[] {
  return boardPlateSpecsOf(shape, marks, progress).map(plateOfSpec)
}

/** How much of the shorter side of a shape of a board an icon it carries takes, so that it fits whole within it. */
const carriedShare = 0.72

/** The side of the square an icon is carried in, on a shape of a board. */
export function carriedSideOf(shape: BoardShape): number {
  const { width, height } = boardShapes[shape]
  return Math.min(width, height) * carriedShare
}

/**
 * The matrix that lays the square an icon is carried in onto the face of a shape of a board, as
 * the plane of the board comes out under the view: a plane drawn from above its side keeps every
 * line on it straight, so the square comes out as it is, tilted with the board.
 */
export function carriedMatrixOf(view: AssetView, shape: BoardShape): string {
  const { height } = boardShapes[shape]
  const side = carriedSideOf(shape)
  const at = (across: number, upAlong: number): Vec3 => boardAt(across, upAlong, boardLift)
  const placed = (point: Vec3): { x: number; y: number } => {
    const turned = turnedOf(point, view)
    return { x: 12 + turned.x, y: 12 - turned.y }
  }
  const topLeft = placed(at(-side / 2, height / 2 + side / 2))
  const topRight = placed(at(side / 2, height / 2 + side / 2))
  const bottomLeft = placed(at(-side / 2, height / 2 - side / 2))
  return `matrix(${String((topRight.x - topLeft.x) / side)} ${String((topRight.y - topLeft.y) / side)} ${String((bottomLeft.x - topLeft.x) / side)} ${String((bottomLeft.y - topLeft.y) / side)} ${String(topLeft.x)} ${String(topLeft.y)})`
}
