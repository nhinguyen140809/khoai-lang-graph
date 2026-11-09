import { clamp } from '@/shared/lib/numbers'

/** A point on the canvas of a graph. */
interface EdgePoint {
  x: number
  y: number
}

interface SmoothEdgePathOptions {
  /** How far before `to` the line stops, along the way it runs, so an arrowhead has room before the node; none when absent. */
  endGap?: number | undefined
}

/** The path of an edge, and the middle of it, where a label sits. */
interface SmoothEdgePath {
  path: string
  labelX: number
  labelY: number
}

// How much of the rise between the two ends the line takes up at its start and at its end.
const LIFT = { start: 0.2, end: 0.4 }
// The arms of a curve: a share of the run, the shortest and the longest they may run in pixels, and
// how steep one may be, as its rise over its run (about 39 degrees).
const ARM = { share: 0.4, min: 24, max: 120, maxSlope: 0.8 }

/**
 * The path of an edge that runs across a canvas from `from` to `to`, a cubic curve whose two ends
 * lean the way the line travels instead of leaving and arriving square to a node. An arrowhead at
 * the end follows the tangent of the curve there, so it points along the edge and not straight into
 * the side of the node. A flat edge is a straight line, and the more the two ends differ in height
 * the more the curve leans, up to the steepness of an arm.
 */
export function smoothEdgePath(
  from: EdgePoint,
  to: EdgePoint,
  { endGap = 0 }: SmoothEdgePathOptions = {},
): SmoothEdgePath {
  const direction = to.x >= from.x ? 1 : -1
  const endX = to.x - direction * Math.min(endGap, Math.abs(to.x - from.x) / 2)
  const run = Math.abs(endX - from.x)
  const rise = to.y - from.y
  const arm = Math.min(ARM.max, Math.max(run * ARM.share, Math.min(ARM.min, run / 2)))
  const maxLift = arm * ARM.maxSlope
  const endLift = clamp(rise * LIFT.end, { min: -maxLift, max: maxLift })
  const startLift = clamp(rise * LIFT.start, { min: -maxLift, max: maxLift })

  const first = { x: from.x + direction * arm, y: from.y + startLift }
  const second = { x: endX - direction * arm, y: to.y - endLift }

  return {
    path: `M ${String(from.x)},${String(from.y)} C ${String(first.x)},${String(first.y)} ${String(second.x)},${String(second.y)} ${String(endX)},${String(to.y)}`,
    // A cubic curve at its middle weighs its four points as 1, 3, 3 and 1 eighths.
    labelX: (from.x + 3 * first.x + 3 * second.x + endX) / 8,
    labelY: (from.y + 3 * first.y + 3 * second.y + to.y) / 8,
  }
}
