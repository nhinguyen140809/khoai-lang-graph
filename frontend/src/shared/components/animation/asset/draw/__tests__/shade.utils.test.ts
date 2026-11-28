import { describe, expect, it } from 'vitest'

import type { Vec3 } from '../../asset.types'
import { fillOf, litOf, normalOf } from '../shade.utils'

const ahead: Vec3 = { x: 0, y: 0, z: 1 }
const flat: readonly Vec3[] = [
  { x: -1, y: 0, z: -1 },
  { x: -1, y: 0, z: 1 },
  { x: 1, y: 0, z: 1 },
  { x: 1, y: 0, z: -1 },
]

describe('normalOf', () => {
  it('points along the side the corners wind around', () => {
    expect(
      normalOf([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ]),
    ).toEqual(ahead)
    expect(normalOf(flat)).toEqual({ x: 0, y: 1, z: 0 })
  })
})

describe('litOf', () => {
  it('lights a face that looks toward the light, and none for one that lies across it', () => {
    const view = { yaw: 0, pitch: 0 }
    expect(litOf({ x: -0.4, y: 0.55, z: 0.73 }, view)).toBeCloseTo(1)
    expect(litOf({ x: 0.8, y: -0.6, z: 0 }, view)).toBeCloseTo(0)
  })

  it('lights the back of a sheet as much as its front, for it is the same sheet seen from the other side', () => {
    expect(litOf(ahead, { yaw: 180, pitch: 0 })).toBeCloseTo(litOf(ahead, { yaw: 0, pitch: 0 }))
  })
})

describe('fillOf', () => {
  it('fills a face in the light with its color alone, and one in the dark no further than the darkest share', () => {
    expect(fillOf('a', 1, 0)).toBe('var(--icon-a, currentColor)')
    expect(fillOf('b', 1, 0)).toBe('var(--icon-b, currentColor)')
    expect(fillOf('a', 0, 0)).toBe('color-mix(in oklch, var(--icon-a, currentColor), black 55%)')
    expect(fillOf('a', 0, 100)).toBe('color-mix(in oklch, var(--icon-a, currentColor), black 90%)')
  })

  it('lets a share of what stands behind a translucent face through it', () => {
    expect(fillOf('a', 1, 0, 0.35)).toBe(
      'color-mix(in oklch, var(--icon-a, currentColor) 35%, transparent)',
    )
    expect(fillOf('a', 0, 14, 0.5)).toBe(
      'color-mix(in oklch, color-mix(in oklch, var(--icon-a, currentColor), black 69%) 50%, transparent)',
    )
  })

  it('shades a face by what it was given over what the light makes it', () => {
    expect(fillOf('a', 1, 12)).toBe('color-mix(in oklch, var(--icon-a, currentColor), black 12%)')
  })
})
