import { describe, expect, it } from 'vitest'

import {
  blobCoreRadius,
  blobFarRadius,
  blobReach,
  blobSideRadius,
  faceColors,
  farApartGap,
  maxColorGap,
  minColorGap,
} from '../face-look.constants'
import { blobShapes, eyeGaps, eyeShapes } from '../face-look.types'
import { faceOf, hashOf } from '../face-look.utils'

const roles = [
  'planner',
  'persona_generator',
  'interviewer',
  'persona_agent',
  'analyst',
  'requirement_engineer',
  'backlog_manager',
  'validator',
  'intent_router',
]

describe('hashOf', () => {
  it('is the same for the same text and different for another', () => {
    expect(hashOf('analyst')).toBe(hashOf('analyst'))
    expect(hashOf('analyst')).not.toBe(hashOf('validator'))
  })
})

describe('faceOf', () => {
  it('gives the same face for the same seed', () => {
    expect(faceOf('interviewer')).toEqual(faceOf('interviewer'))
  })

  it.each([...roles, 'any-other-key', ''])('gives a face that is in range for %j', (seed) => {
    const look = faceOf(seed)

    expect([1, 2]).toContain(look.colors.length)
    expect(new Set(look.colors).size).toBe(look.colors.length)
    for (const color of look.colors) expect(faceColors).toContain(color)
    for (const blob of look.blobs) {
      expect(blobShapes).toContain(blob.shape)
      expect(blob.turn).toBeGreaterThanOrEqual(0)
      expect(blob.turn).toBeLessThanOrEqual(180)
    }
    expect(look.reach).toBeGreaterThanOrEqual(blobReach.min)
    expect(look.reach).toBeLessThanOrEqual(blobReach.max)
    expect(eyeShapes).toContain(look.eyes)
    expect(eyeGaps).toContain(look.gap)
    expect(look.phase).toBeGreaterThanOrEqual(0)
    expect(look.phase).toBeLessThan(1)
  })

  it('tells the agents of the workflow apart: no two share the colors and the eyes', () => {
    const looks = roles.map((role) => JSON.stringify(faceOf(role)))

    expect(new Set(looks).size).toBe(roles.length)
    expect(new Set(roles.map((role) => faceOf(role).eyes)).size).toBeGreaterThan(1)
  })

  it('mixes one color for some faces and two for others', () => {
    const counts = new Set(
      Array.from({ length: 40 }, (_, index) => faceOf(`agent-${String(index)}`).colors.length),
    )

    expect(counts).toEqual(new Set([1, 2]))
  })

  it('uses every color of the palette for some face', () => {
    const used = new Set(
      Array.from({ length: 200 }, (_, index) => faceOf(`agent-${String(index)}`).colors[0]),
    )

    expect(used.size).toBe(faceColors.length)
  })

  it('puts the deep color near the center and the other far from it, so that the gradient is seen', () => {
    for (let index = 0; index < 200; index += 1) {
      const look = faceOf(`agent-${String(index)}`)
      const [core, far] = look.spots
      const [first = 0, second = 0] = look.colors.map((color) =>
        faceColors.findIndex((known) => known === color),
      )
      const direct = Math.abs(first - second)
      const apart = look.colors.length === 2 ? Math.min(direct, faceColors.length - direct) : 0
      const coreDistance = Math.hypot(core.x - 50, core.y - 50)
      const farDistance = Math.hypot(far.x - 50, far.y - 50)

      // The places are rounded to whole percents, so a whole one more or less is allowed.
      if (apart >= farApartGap) {
        // Colors that are far apart on the wheel sit on two sides, and neither is in the middle.
        expect(coreDistance).toBeGreaterThanOrEqual(blobSideRadius.min - 1)
        expect(farDistance).toBeGreaterThanOrEqual(blobSideRadius.min - 1)
      } else {
        expect(coreDistance).toBeLessThanOrEqual(blobCoreRadius.max + 1)
        expect(farDistance).toBeGreaterThanOrEqual(blobFarRadius.min - 1)
      }
    }
  })

  it('keeps the two colors of a face neither close nor across the wheel from each other', () => {
    for (let index = 0; index < 300; index += 1) {
      const [first, second] = faceOf(`agent-${String(index)}`).colors as readonly string[]

      if (first !== undefined && second !== undefined) {
        const direct = Math.abs(
          faceColors.findIndex((color) => color === first) -
            faceColors.findIndex((color) => color === second),
        )
        expect(Math.min(direct, faceColors.length - direct)).toBeGreaterThanOrEqual(minColorGap)
        expect(Math.min(direct, faceColors.length - direct)).toBeLessThanOrEqual(maxColorGap)
      }
    }
  })
})
