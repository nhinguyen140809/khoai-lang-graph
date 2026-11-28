import { describe, expect, it } from 'vitest'

import { discCornersOf, plateOfSpec, rodOf, taperOf, tubeOf } from '../shape.utils'

describe('discCornersOf', () => {
  it('draws an arc of a disc from where it is told, as far as it is told', () => {
    const arc = discCornersOf({
      radius: 2,
      count: 3,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      from: 90,
      sweep: 90,
    })
    expect(arc[0]?.x).toBeCloseTo(0)
    expect(arc[0]?.z).toBeCloseTo(2)
    expect(arc[2]?.x).toBeCloseTo(-Math.sqrt(3))
    expect(arc[2]?.z).toBeCloseTo(1)
  })

  it('lays a disc of as many sides as asked, each corner as far from the middle, in the plane the two axes span', () => {
    const disc = discCornersOf({
      radius: 2,
      count: 4,
      center: { x: 0, y: 5, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
    })
    expect(disc).toHaveLength(4)
    expect(disc[0]?.x).toBeCloseTo(2)
    expect(disc[0]?.z).toBeCloseTo(0)
    expect(disc[1]?.x).toBeCloseTo(0)
    expect(disc[1]?.z).toBeCloseTo(2)
    for (const corner of disc) {
      expect(Math.hypot(corner.x, corner.z)).toBeCloseTo(2)
      expect(corner.y).toBe(5)
    }
  })
})

describe('tubeOf', () => {
  it('draws a tube as one flat side for each pair of edges beside one another, each as far from its axis, half above it and half below', () => {
    const tube = tubeOf({
      radius: 2,
      height: 1,
      count: 4,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      face: 'a',
    })
    expect(tube).toHaveLength(4)
    for (const side of tube) {
      expect(side.corners).toHaveLength(4)
      for (const corner of side.corners) {
        expect(Math.hypot(corner.x, corner.z)).toBeCloseTo(2)
        expect(Math.abs(corner.y)).toBeCloseTo(0.5)
      }
    }
  })
})

describe('rodOf', () => {
  it('draws a rod as the walls of its girth with a cap on each end, every corner as far from its axis', () => {
    const rod = rodOf({
      radius: 2,
      height: 5,
      count: 6,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      face: 'a',
    })
    expect(rod).toHaveLength(6 + 2)
    // Where something else closes an end, the rod caps only the other one.
    const backOnly = rodOf({
      radius: 2,
      height: 5,
      count: 6,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      face: 'a',
      caps: 'back',
    })
    expect(backOnly).toHaveLength(6 + 1)
    for (const plate of rod) {
      for (const corner of plate.corners) {
        expect(Math.hypot(corner.x, corner.z)).toBeCloseTo(2)
        expect(Math.abs(corner.y)).toBeCloseTo(2.5)
      }
    }
  })
})

describe('taperOf', () => {
  it('draws a slope for each side of the ring it runs out from, all meeting at the point', () => {
    const to = { x: 0, y: 3, z: 0 }
    const taper = taperOf({
      radius: 2,
      count: 5,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      to,
      face: 'b',
    })
    expect(taper).toHaveLength(5)
    for (const slope of taper) {
      expect(slope.corners).toHaveLength(3)
      expect(slope.corners[2]).toEqual(to)
    }
  })
})

describe('plateOfSpec', () => {
  it('stands a box up from its corner along the two ways it is told, turned as a whole when it says so', () => {
    const plain = plateOfSpec({
      box: {
        at: { x: 1, y: 0, z: 0 },
        across: { x: 2, y: 0, z: 0 },
        up: { x: 0, y: 3, z: 0 },
      },
      face: 'a',
    })
    expect(plain.corners).toEqual([
      { x: 1, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 1, y: 3, z: 0 },
    ])

    const turned = plateOfSpec({
      box: {
        at: { x: 0, y: 0, z: 0 },
        across: { x: 2, y: 0, z: 0 },
        up: { x: 0, y: 0, z: 2 },
      },
      face: 'b',
      turn: { about: { x: 0, y: 0, z: 0 }, along: { x: 0, y: 1, z: 0 }, by: 90 },
    })
    const corner = turned.corners[1]
    expect(corner?.z).toBeCloseTo(-2)
    expect(corner?.x).toBeCloseTo(0)
  })

  it('tells a disc as a round plate of many corners, and corners given outright as they are', () => {
    const disc = plateOfSpec({
      disc: {
        at: { x: 0, y: 0, z: 0 },
        radius: 2,
        across: { x: 1, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
      },
      face: 'a',
    })
    expect(disc.round).toBe(true)
    expect(disc.corners.length).toBe(24)

    const poly = plateOfSpec({
      poly: {
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
        ],
      },
      face: 'b',
      soft: 0.5,
    })
    expect(poly.corners).toHaveLength(2)
    expect(poly.soft).toBe(0.5)

    // A frame told as data carries its hole, the bezel of a laptop around its display.
    const frame = plateOfSpec({
      poly: {
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 4, y: 0, z: 0 },
          { x: 4, y: 4, z: 0 },
          { x: 0, y: 4, z: 0 },
        ],
        inner: [
          { x: 1, y: 1, z: 0 },
          { x: 3, y: 1, z: 0 },
          { x: 3, y: 3, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      face: 'a',
      thickness: 1,
    })
    expect(frame.inner).toHaveLength(4)
  })
})
