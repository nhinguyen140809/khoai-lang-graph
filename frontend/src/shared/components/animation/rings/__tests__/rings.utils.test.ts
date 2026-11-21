import { describe, expect, it } from 'vitest'

import { ringsBox, ringShapes, ringsShapesByVariant } from '../rings.constants'
import { ringPathOf } from '../rings.utils'

const shapeNames = Object.keys(ringShapes) as (keyof typeof ringShapes)[]

describe('ringPathOf', () => {
  it('gives every shape the same six curves, so that the browser can move between them', () => {
    for (const name of shapeNames) {
      expect(ringPathOf(ringShapes[name], ringsBox.firstRadius)).toMatch(
        /^path\("M[^C]+(C[^C]+){6}Z"\)$/,
      )
    }
  })

  it('starts on the right of the middle for a circle, at the radius', () => {
    const [, x, y] = /^path\("M([\d.]+) ([\d.]+)/.exec(ringPathOf(ringShapes.circle, 10)) ?? []

    expect(Number(x)).toBeCloseTo(ringsBox.size / 2 + 10)
    expect(Number(y)).toBeCloseTo(ringsBox.size / 2)
  })

  it('keeps the points that every ring passes through, and its stroke, inside the drawing', () => {
    const margin = ringsBox.strokeWidth / 2
    const names = Object.values(ringsShapesByVariant).flatMap((rings) => [
      ...rings.first,
      ...rings.second,
    ])
    for (const name of names) {
      const path = ringPathOf(ringShapes[name], ringsBox.firstRadius)
      const curves = path.slice(0, path.indexOf('Z')).split('C').slice(1)
      const ends = curves.flatMap((curve) => curve.split(' ').slice(-2).map(Number))

      expect(curves).toHaveLength(6)
      expect(Math.min(...ends)).toBeGreaterThan(margin)
      expect(Math.max(...ends)).toBeLessThan(ringsBox.size - margin)
    }
  })
})
