import { describe, expect, it } from 'vitest'

import type { Vec3 } from '../../asset.types'
import { turnedAbout, turnedOf, turnedViewOf, unTurnedOf } from '../turn.utils'

const ahead: Vec3 = { x: 0, y: 0, z: 1 }

describe('turnedOf', () => {
  it('leaves a point as it is when the view looks straight at it', () => {
    expect(turnedOf({ x: 1, y: 2, z: 3 }, { yaw: 0, pitch: 0 })).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('turns the right side of a point away when the yaw does a right angle', () => {
    const turned = turnedOf({ x: 1, y: 0, z: 0 }, { yaw: 90, pitch: 0 })
    expect(turned.x).toBeCloseTo(0)
    expect(turned.y).toBeCloseTo(0)
    expect(turned.z).toBeCloseTo(-1)
  })

  it('tips a point that stands up toward the viewer when the pitch does a right angle', () => {
    const turned = turnedOf({ x: 0, y: 1, z: 0 }, { yaw: 0, pitch: 90 })
    expect(turned.x).toBeCloseTo(0)
    expect(turned.y).toBeCloseTo(0)
    expect(turned.z).toBeCloseTo(1)
  })
})

describe('turnedViewOf', () => {
  it('takes the drag along into the yaw and the pitch, as far as a pixel turns them', () => {
    expect(turnedViewOf({ yaw: -35, pitch: 22 }, 40, 20)).toEqual({ yaw: -5, pitch: 37 })
  })

  it('wraps the yaw around the circle, and stops the pitch at looking straight from above or below', () => {
    expect(turnedViewOf({ yaw: 170, pitch: 0 }, 40, 0)).toEqual({ yaw: -160, pitch: 0 })
    expect(turnedViewOf({ yaw: -35, pitch: 85 }, 0, 100)).toEqual({ yaw: -35, pitch: 90 })
    expect(turnedViewOf({ yaw: -35, pitch: -85 }, 0, -100)).toEqual({ yaw: -35, pitch: -90 })
  })
})

describe('unTurnedOf', () => {
  it('puts a point of the view back where it stands, the other way of turnedOf', () => {
    const view = { yaw: -35, pitch: 22 }
    const point = { x: 1.2, y: -0.7, z: 2.9 }
    const back = unTurnedOf(turnedOf(point, view), view)
    expect(back.x).toBeCloseTo(point.x)
    expect(back.y).toBeCloseTo(point.y)
    expect(back.z).toBeCloseTo(point.z)
    const forth = turnedOf(unTurnedOf(point, view), view)
    expect(forth.x).toBeCloseTo(point.x)
    expect(forth.y).toBeCloseTo(point.y)
    expect(forth.z).toBeCloseTo(point.z)
  })
})

describe('turnedAbout', () => {
  it('leaves a point on the axis where it is', () => {
    const axis = { origin: { x: 0, y: 0, z: -2 }, direction: { x: 1, y: 0, z: 0 } }
    const turned = turnedAbout({ x: 5, y: 0, z: -2 }, axis, 90)
    expect(turned.x).toBeCloseTo(5)
    expect(turned.y).toBeCloseTo(0)
    expect(turned.z).toBeCloseTo(-2)
  })

  it('carries a point beside the axis around it', () => {
    const axis = { origin: { x: 0, y: 0, z: 0 }, direction: ahead }
    const turned = turnedAbout({ x: 1, y: 0, z: 0 }, axis, 90)
    expect(turned.x).toBeCloseTo(0)
    expect(turned.y).toBeCloseTo(1)
    expect(turned.z).toBeCloseTo(0)
  })
})
