import { describe, expect, it } from 'vitest'

import { mixAt, starAt } from '../glint.utils'

/** The points of a `polygon(...)` as numbers. */
function pointsOf(polygon: string): [number, number][] {
  return [...polygon.matchAll(/([\d.]+)% ([\d.]+)%/g)].map((point) => [
    Number(point[1]),
    Number(point[2]),
  ])
}

describe('starAt', () => {
  it('has 48 points at every moment of its round, so that the shapes can be mixed', () => {
    for (const progress of [0, 0.1, 0.25, 0.4, 0.5, 0.75, 0.99, 1]) {
      expect(pointsOf(starAt(progress))).toHaveLength(48)
    }
  })

  it('is the star at the ends of its round and the rounded square at the middle', () => {
    expect(pointsOf(starAt(0))[1]).toEqual([79.9, 53.9])
    expect(pointsOf(starAt(1))).toEqual(pointsOf(starAt(0)))
    expect(pointsOf(starAt(0.5))[1]).toEqual([99.1, 56.5])
  })

  it('has a tip on each side of the middle', () => {
    const points = pointsOf(starAt(0))

    expect([points[0], points[12], points[24], points[36]]).toEqual([
      [100, 50],
      [50, 100],
      [0, 50],
      [50, 0],
    ])
  })
})

describe('mixAt', () => {
  it('takes none of the second color at the ends of the round and all of it at the middle', () => {
    expect([mixAt(0), mixAt(0.5), mixAt(1)]).toEqual([0, 1, 0])
  })
})
