import { cubicBezier } from 'motion/react'

import { glintMorphStops, glintShapes } from './glint.constants'

type Point = readonly [number, number]

/** How each part of the round eases: fast to begin with and slow to settle, as a change of size does. */
const ease = cubicBezier(0.2, 0, 0, 1)

/** The share of the way from one stop to the next that a point of the round has gone, eased, and the stops that it lies between. */
function segmentAt(progress: number): { from: number; to: number; share: number } {
  const last = glintMorphStops.length - 1
  const next = glintMorphStops.findIndex((stop) => stop.at > progress)
  const index = next === -1 ? last - 1 : Math.max(0, next - 1)
  const from = glintMorphStops[index]
  const to = glintMorphStops[index + 1]
  if (from === undefined || to === undefined) return { from: 0, to: 0, share: 0 }
  return { from: index, to: index + 1, share: ease((progress - from.at) / (to.at - from.at)) }
}

/** The 48 points of a shape, from its seven: the other five of a quarter are these mirrored across the diagonal, and the other three quarters are the first turned about the middle. */
function pointsOf(half: readonly Point[]): Point[] {
  const quarter: Point[] = [...half]
  for (let index = 7; index < 12; index += 1) {
    const [x, y] = half[12 - index] ?? [50, 50]
    quarter.push([y, x])
  }
  const turn = ([x, y]: Point): Point => [100 - y, x]
  const second = quarter.map(turn)
  const third = second.map(turn)
  const fourth = third.map(turn)
  return [...quarter, ...second, ...third, ...fourth]
}

/** The points of each shape, worked out once. */
const outlines = {
  star: pointsOf(glintShapes.star),
  fuller: pointsOf(glintShapes.fuller),
  square: pointsOf(glintShapes.square),
}

/** The `clip-path` of the star at a point of its round (from 0 to 1): the shape that it has there. */
export function starAt(progress: number): string {
  const { from, to, share } = segmentAt(progress)
  const a = outlines[glintMorphStops[from]?.shape ?? 'star']
  const b = outlines[glintMorphStops[to]?.shape ?? 'star']
  const points = a.map(([x, y], index) => {
    const [bx, by] = b[index] ?? [x, y]
    return `${String(x + (bx - x) * share)}% ${String(y + (by - y) * share)}%`
  })
  return `polygon(${points.join(',')})`
}

/** How much of the second color the star takes at a point of its round: none at the ends, all of it at the middle. */
export function mixAt(progress: number): number {
  return ease(progress < 0.5 ? progress * 2 : (1 - progress) * 2)
}
