import { describe, expect, it } from 'vitest'

import { smoothEdgePath } from '../edge-path.utils'

/** The numbers of a path `M x,y C x,y x,y x,y`, in order. */
function pointsOf(path: string): number[] {
  return path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
}

describe('smoothEdgePath', () => {
  it('draws a flat edge as a straight line along its row, with its label in the middle', () => {
    const { path, labelX, labelY } = smoothEdgePath({ x: 200, y: 50 }, { x: 0, y: 50 })

    const [startX, startY, , firstY, , secondY, endX, endY] = pointsOf(path)
    expect([startX, startY, endX, endY]).toEqual([200, 50, 0, 50])
    // Every point of the curve sits on the row, so the arrow arrives level.
    expect([firstY, secondY]).toEqual([50, 50])
    expect([labelX, labelY]).toEqual([100, 50])
  })

  it('arrives leaning the way the edge travels, never square to the side of the node', () => {
    // From the right going left and down: the end of the line is lower than the start.
    const { path } = smoothEdgePath({ x: 300, y: 0 }, { x: 0, y: 120 })

    const [, , , , secondX, secondY, endX, endY] = pointsOf(path)
    const rise = (endY ?? 0) - (secondY ?? 0)
    const run = (endX ?? 0) - (secondX ?? 0)
    // The arrowhead follows this tangent: it runs left, and down, not straight left.
    expect(run).toBeLessThan(0)
    expect(rise).toBeGreaterThan(0)
  })

  it('leans the other way for an edge that climbs, by the same amount', () => {
    const down = pointsOf(smoothEdgePath({ x: 300, y: 0 }, { x: 0, y: 100 }).path)
    const up = pointsOf(smoothEdgePath({ x: 300, y: 100 }, { x: 0, y: 0 }).path)

    expect((down[7] ?? 0) - (down[5] ?? 0)).toBeCloseTo(-((up[7] ?? 0) - (up[5] ?? 0)))
  })

  it('keeps an arm no steeper than its limit, however far apart the two ends are in height', () => {
    const { path } = smoothEdgePath({ x: 120, y: 0 }, { x: 0, y: 4000 })

    const [, , , , secondX, secondY, endX, endY] = pointsOf(path)
    const slope = Math.abs(((endY ?? 0) - (secondY ?? 0)) / ((endX ?? 0) - (secondX ?? 0)))
    expect(slope).toBeLessThanOrEqual(0.8 + 1e-9)
  })

  it('stops before the node by the gap it is given, along the way the edge runs', () => {
    const left = pointsOf(smoothEdgePath({ x: 200, y: 0 }, { x: 0, y: 0 }, { endGap: 8 }).path)
    const right = pointsOf(smoothEdgePath({ x: 0, y: 0 }, { x: 200, y: 0 }, { endGap: 8 }).path)

    // Going left the line ends 8 pixels to the right of its target, going right 8 to the left.
    expect(left[6]).toBe(8)
    expect(right[6]).toBe(192)
  })

  it('does not run past the middle when the gap is wider than the room it has', () => {
    const { path } = smoothEdgePath({ x: 10, y: 0 }, { x: 0, y: 0 }, { endGap: 50 })

    const endX = pointsOf(path)[6] ?? Number.NaN
    expect(endX).toBeGreaterThanOrEqual(0)
    expect(endX).toBeLessThanOrEqual(10)
  })
})
