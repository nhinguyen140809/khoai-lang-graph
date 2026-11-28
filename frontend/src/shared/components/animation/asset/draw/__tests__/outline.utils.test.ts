import { describe, expect, it } from 'vitest'

import type { Vec3 } from '../../asset.types'
import { bulgingOf, ellipseOf, pathOf, roundedOf } from '../outline.utils'
import { discCornersOf } from '../shape.utils'

const flat: readonly Vec3[] = [
  { x: -1, y: 0, z: -1 },
  { x: -1, y: 0, z: 1 },
  { x: 1, y: 0, z: 1 },
  { x: 1, y: 0, z: -1 },
]

describe('pathOf', () => {
  it('lays a face on its frame, its up to the top of it, as one closed outline', () => {
    expect(pathOf(flat, { yaw: 0, pitch: 45 })).toBe('M11 11.29L11 12.71L13 12.71L13 11.29Z')
    expect(pathOf(flat, { yaw: 45, pitch: 45 })).toBe('M10.59 12L12 13L13.41 12L12 11Z')
  })

  it('draws the hole of a ring inside its outline, as an outline of its own', () => {
    const outer = [
      { x: -2, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: -2, y: 2, z: 0 },
    ]
    const inner = [
      { x: -1, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: -1, y: 1, z: 0 },
    ]
    const path = pathOf(outer, { yaw: 0, pitch: 90 }, inner)
    expect(path.match(/M/g)?.length).toBe(2)
    expect(path.endsWith('Z')).toBe(true)
  })

  it('lays a sheet seen along its own plane as the line it becomes', () => {
    expect(pathOf(flat, { yaw: 0, pitch: 0 })).toBe('M11 12L11 12L13 12L13 12Z')
  })
})

describe('ellipseOf', () => {
  it('draws a disc seen straight on as one true circle, in two arcs, and an inner hole within it', () => {
    const disc = discCornersOf({
      radius: 4,
      count: 16,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const drawn = ellipseOf(disc, { yaw: 0, pitch: 0 })
    expect(drawn).toMatch(/^M/)
    expect(drawn.match(/A/g)?.length).toBe(2)
    expect(drawn).not.toContain('L')

    const hole = discCornersOf({
      radius: 2,
      count: 16,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    expect(ellipseOf(disc, { yaw: 0, pitch: 0 }, hole).match(/A/g)?.length).toBe(4)
  })

  it('draws one circle the same whichever pair of its quarters the corners stand at, so the circles of one rim run parallel', () => {
    const circle = discCornersOf({
      radius: 4,
      count: 20,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const view = { yaw: -35, pitch: 22 }
    const ahead = /A[\d.-]+ [\d.-]+ (-?[\d.]+)/.exec(ellipseOf(circle, view))?.[1]
    const behind = /A[\d.-]+ [\d.-]+ (-?[\d.]+)/.exec(ellipseOf([...circle].reverse(), view))?.[1]
    expect(ahead).toBeDefined()
    expect(behind).toBe(ahead)
  })
})

describe('roundedOf', () => {
  it('draws a soft cornered plate with a curve at each corner, straight between them', () => {
    const drawn = roundedOf(
      [
        { x: -2, y: -1, z: 0 },
        { x: -2, y: 1, z: 0 },
        { x: 2, y: 1, z: 0 },
        { x: 2, y: -1, z: 0 },
      ],
      { yaw: 0, pitch: 0 },
      0.5,
    )
    expect(drawn).toMatch(/^M/)
    expect(drawn.match(/Q/g)?.length).toBe(4)
    expect(drawn).toContain('L')
  })
})

describe('bulgingOf', () => {
  it('draws a wall between two circles with its ends bulged out, as curves, not straight runs', () => {
    const drawn = bulgingOf(
      [
        { x: 4, y: -1, z: 0 },
        { x: 4, y: 1, z: 0 },
        { x: 5, y: 1, z: 0 },
        { x: 5, y: -1, z: 0 },
      ],
      { yaw: 0, pitch: 0 },
      { first: { x: 0, y: 0, z: 0 }, second: { x: 1, y: 0, z: 0 } },
    )
    expect(drawn).toMatch(/^M/)
    expect(drawn.match(/Q/g)?.length).toBe(2)
    expect(drawn).toContain('L')
  })
})
