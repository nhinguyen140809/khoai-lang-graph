import { describe, expect, it } from 'vitest'

import type { AssetPlate, Vec3 } from '../../asset.types'
import { assetOf } from '../asset.utils'
import { discCornersOf, tubeOf } from '../shape.utils'

const flat: readonly Vec3[] = [
  { x: -1, y: 0, z: -1 },
  { x: -1, y: 0, z: 1 },
  { x: 1, y: 0, z: 1 },
  { x: 1, y: 0, z: -1 },
]

describe('assetOf', () => {
  const low: AssetPlate = { corners: flat, face: 'a' }

  it('draws a sheet as one face, and a plate of some thickness as a closed box: its front, its back, and the band of its sides around it', () => {
    const sheet: AssetPlate = { corners: flat, face: 'a' }
    expect(assetOf([sheet], { yaw: 0, pitch: 0 })).toHaveLength(1)

    const slab: AssetPlate = { corners: flat, face: 'a', thickness: 1 }
    const drawn = assetOf([slab], { yaw: 0, pitch: 22 })
    expect(drawn).toHaveLength(6)
    expect(drawn.every((face) => face.d.endsWith('Z'))).toBe(true)
    expect(drawn.every((face) => face.fill.length > 0)).toBe(true)
  })

  it('fades the faces that lie behind into the color of the background, the farther the more', () => {
    const near: AssetPlate = {
      corners: flat.map((corner) => ({ ...corner, z: corner.z + 4 })),
      face: 'b',
    }
    const drawn = assetOf([low, near], { yaw: 0, pitch: 0 }, 1)
    expect(drawn[0]?.fill).toContain('var(--background)')
    expect(drawn[1]?.fill).not.toContain('var(--background)')

    const into = assetOf([low, near], { yaw: 0, pitch: 0 }, 1, 'var(--foreground)')
    expect(into[0]?.fill).toContain('var(--foreground)')
    expect(into[1]?.fill).not.toContain('var(--foreground)')
  })

  it('draws the face that is nearer to the viewer after the one that is farther', () => {
    const low: AssetPlate = { corners: flat, face: 'a' }
    const high: AssetPlate = {
      corners: flat.map((corner) => ({ x: corner.x, y: corner.y + 5, z: corner.z + 2 })),
      face: 'b',
    }
    const drawn = assetOf([high, low], { yaw: 0, pitch: 0 })
    expect(drawn[0]?.fill).toContain('--icon-a')
    expect(drawn[1]?.fill).toContain('--icon-b')
  })

  it('fills a face that shows a light of its own with its color alone, turned away or not', () => {
    const lit: AssetPlate = { corners: flat, face: 'b', glow: true }
    expect(assetOf([lit], { yaw: 0, pitch: 0 })[0]?.fill).toBe('var(--icon-b, currentColor)')
    expect(assetOf([lit], { yaw: 180, pitch: 0 })[0]?.fill).toBe('var(--icon-b, currentColor)')
  })

  it('draws the walls of a tube with their ends curved, and the rim of a ring the same', () => {
    const tube = tubeOf({
      radius: 3,
      height: 1,
      count: 8,
      center: { x: 0, y: 0, z: 0 },
      span: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      face: 'a',
    })
    const drawn = assetOf(tube, { yaw: -35, pitch: 22 })
    expect(drawn.every((face) => face.d.includes('Q'))).toBe(true)
  })

  it('spreads the fill of the walls of a thick ring from the color of one side to the other', () => {
    const rim: AssetPlate = {
      corners: discCornersOf({
        radius: 3,
        count: 8,
        center: { x: 0, y: 0, z: 0 },
        span: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      }),
      face: 'a',
      thickness: 1,
      round: true,
    }
    const drawn = assetOf([rim], { yaw: -35, pitch: 22 })
    const walls = drawn.filter((face) => face.spread !== undefined)
    expect(walls.length).toBeGreaterThan(4)
    // A wall whose two ends face the light the same way keeps one color on both ends, but most
    // of them run from one color to another.
    expect(walls.some((wall) => wall.spread?.fills[0] !== wall.spread?.fills[1])).toBe(true)
    for (const wall of walls) {
      expect(wall.spread?.from).toBeDefined()
      expect(wall.spread?.to).toBeDefined()
    }
  })

  it('draws the wall across a soft corner along the same curve the faces take, so the two meet without a step', () => {
    const bubble: AssetPlate = {
      corners: [
        { x: -2, y: 1, z: 0 },
        { x: -2, y: -1, z: 0 },
        { x: 2, y: -1, z: 0 },
        { x: 2, y: 1, z: 0 },
      ],
      face: 'a',
      thickness: 1,
      soft: 0.5,
    }
    const drawn = assetOf([bubble], { yaw: -35, pitch: 22 })
    const across = drawn.filter((face) => face.d.includes('Q'))
    expect(across.length).toBeGreaterThanOrEqual(4)
  })

  it('draws a thick ring as small faces only, so that the order of drawing follows each face own place in view', () => {
    const rim: AssetPlate = {
      corners: discCornersOf({
        radius: 3,
        count: 8,
        center: { x: 0, y: 0, z: 0 },
        span: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      }),
      inner: discCornersOf({
        radius: 2,
        count: 8,
        center: { x: 0, y: 0, z: 0 },
        span: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      }),
      face: 'a',
      thickness: 1.3,
      round: true,
    }
    const drawn = assetOf([rim], { yaw: -35, pitch: 22 })
    // walls within and without, and the front and the back in a segment per wall: all of them
    // no larger than one span of the ring
    expect(drawn).toHaveLength(32)
    for (const face of drawn) {
      expect(face.d.includes('Q')).toBe(true)
    }
    // every face carries its own place: the shallowest and the deepest differ by the thickness
    // of the ring, turned by the view
    const depths = drawn.map((face) => face.d).length
    expect(depths).toBe(32)
  })

  it('keeps the same number of faces whichever way it is seen, so that a path always has its own to go on', () => {
    const slab: AssetPlate = { corners: flat, face: 'a', thickness: 1 }
    const views = [
      { yaw: -35, pitch: 22 },
      { yaw: 90, pitch: 45 },
      { yaw: 179, pitch: 89 },
      { yaw: -90, pitch: 0 },
    ]
    expect(new Set(views.map((view) => assetOf([slab], view).length))).toEqual(new Set([6]))
  })
})
