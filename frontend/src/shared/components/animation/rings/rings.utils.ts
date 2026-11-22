import { ringsBox } from './rings.constants'
import type { RingShape } from './rings.types'

const fullTurn = 360

function format(value: number): string {
  return value.toFixed(2)
}

/**
 * The outline of a shape as the `path()` of a CSS `d` property, around the middle of the drawing at
 * the given radius. Every shape has the same six curves, so the browser can move from one to another.
 */
export function ringPathOf(shape: RingShape, radius: number): string {
  const middle = ringsBox.size / 2
  const step = fullTurn / shape.radii.length
  const points = shape.radii.map((scale, index) => {
    const angle = (((index * step + (shape.turns[index] ?? 0)) % fullTurn) * Math.PI) / 180
    const distance = radius * scale
    return {
      x: middle + distance * Math.cos(angle),
      y: middle + distance * Math.sin(angle),
      // The way the outline runs at the point, at a right angle to the line from the middle.
      dx: -Math.sin(angle),
      dy: Math.cos(angle),
      reach: distance * (shape.handles[index] ?? 0),
    }
  })
  const curves = points.map((from, index) => {
    const to = points[(index + 1) % points.length]
    if (to === undefined) return ''
    return `C${format(from.x + from.dx * from.reach)} ${format(from.y + from.dy * from.reach)} ${format(to.x - to.dx * to.reach)} ${format(to.y - to.dy * to.reach)} ${format(to.x)} ${format(to.y)}`
  })
  const [start] = points
  if (start === undefined) return ''
  return `path("M${format(start.x)} ${format(start.y)}${curves.join('')}Z")`
}
