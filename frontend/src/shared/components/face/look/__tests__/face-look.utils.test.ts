import { describe, expect, it } from 'vitest'

import { paletteColors } from '@/shared/lib/palette'

import {
  blobCoreRadius,
  blobFarRadius,
  blobReach,
  blobSideRadius,
  defaultFaceRules,
  farApartGap,
  maxColorGap,
  minColorGap,
} from '../face-look.constants'
import { blobShapes, eyeGaps, faceShapes } from '../face-look.types'
import { faceOf } from '../face-look.utils'
import { facePresets } from '../face-preset.constants'

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

describe('faceOf', () => {
  it('gives the same face for the same seed', () => {
    expect(faceOf('interviewer')).toEqual(faceOf('interviewer'))
  })

  it.each([...roles, 'any-other-key', ''])('gives a face that is in range for %j', (seed) => {
    const look = faceOf(seed)

    expect([1, 2]).toContain(look.colors.length)
    expect(new Set(look.colors).size).toBe(look.colors.length)
    for (const color of look.colors) expect(paletteColors).toContain(color)
    for (const blob of look.blobs) {
      expect(blobShapes).toContain(blob.shape)
      expect(blob.turn).toBeGreaterThanOrEqual(0)
      expect(blob.turn).toBeLessThanOrEqual(180)
    }
    expect(look.reach).toBeGreaterThanOrEqual(blobReach.min)
    expect(look.reach).toBeLessThanOrEqual(blobReach.max)
    expect(faceShapes).toContain(look.shape)
    expect(eyeGaps).toContain(look.gap)
    expect(look.phase).toBeGreaterThanOrEqual(0)
    expect(look.phase).toBeLessThan(1)
  })

  it('tells the agents of the workflow apart: no two look the same', () => {
    const looks = roles.map((role) => JSON.stringify(faceOf(role)))

    expect(new Set(looks).size).toBe(roles.length)
    expect(new Set(roles.map((role) => faceOf(role).shape)).size).toBeGreaterThan(1)
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

    expect(used.size).toBe(paletteColors.length)
  })

  it('puts the deep color near the center and the other far from it, so that the gradient is seen', () => {
    for (let index = 0; index < 200; index += 1) {
      const look = faceOf(`agent-${String(index)}`)
      const [core, far] = look.spots
      const [first = 0, second = 0] = look.colors.map((color) =>
        paletteColors.findIndex((known) => known === color),
      )
      const direct = Math.abs(first - second)
      const apart = look.colors.length === 2 ? Math.min(direct, paletteColors.length - direct) : 0
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
          paletteColors.findIndex((color) => color === first) -
            paletteColors.findIndex((color) => color === second),
        )
        expect(Math.min(direct, paletteColors.length - direct)).toBeGreaterThanOrEqual(minColorGap)
        expect(Math.min(direct, paletteColors.length - direct)).toBeLessThanOrEqual(maxColorGap)
      }
    }
  })
})

describe('faceOf with rules given', () => {
  it('gives the same face for the default rules as for none', () => {
    expect(faceOf('interviewer', defaultFaceRules)).toEqual(faceOf('interviewer'))
  })

  it('takes its colors from the palette of the rules', () => {
    const colors = ['var(--a)', 'var(--b)', 'var(--c)', 'var(--d)']
    const rules = { ...defaultFaceRules, colors }
    const used = Array.from({ length: 80 }, (_, index) => faceOf(`agent-${String(index)}`, rules))

    for (const look of used) for (const color of look.colors) expect(colors).toContain(color)
  })

  it('gives every face one color when the share of single colors is all of them', () => {
    const rules = { ...defaultFaceRules, singleColorShare: 1 }

    for (let index = 0; index < 40; index += 1) {
      expect(faceOf(`agent-${String(index)}`, rules).colors).toHaveLength(1)
    }
  })

  it('gives every face two colors when none is single, within the gap of the rules', () => {
    const rules = { ...defaultFaceRules, singleColorShare: 0, minColorGap: 2, maxColorGap: 2 }

    for (let index = 0; index < 40; index += 1) {
      const colors = faceOf(`agent-${String(index)}`, rules).colors as readonly string[]
      const [first, second] = colors
      const direct = Math.abs(
        rules.colors.findIndex((color) => color === first) -
          rules.colors.findIndex((color) => color === second),
      )
      expect(colors).toHaveLength(2)
      expect(Math.min(direct, rules.colors.length - direct)).toBe(2)
    }
  })

  it('gives a face of one color when the palette has no color within the gap', () => {
    const rules = { ...defaultFaceRules, colors: ['var(--only)'], singleColorShare: 0 }

    expect(faceOf('interviewer', rules).colors).toEqual(['var(--only)'])
  })
})

describe('faceOf with shapes given', () => {
  it('takes its outline from the shapes of the rules', () => {
    const rules = { ...defaultFaceRules, shapes: ['ghost', 'drop'] as const }

    for (let index = 0; index < 30; index += 1) {
      expect(['ghost', 'drop']).toContain(faceOf(`agent-${String(index)}`, rules).shape)
    }
  })

  it('uses every outline for some face by default', () => {
    const used = new Set(
      Array.from({ length: 200 }, (_, index) => faceOf(`agent-${String(index)}`).shape),
    )

    expect(used).toEqual(new Set(faceShapes))
  })
})

describe('faceOf with faces made by hand', () => {
  const rules = { ...defaultFaceRules, presets: facePresets }

  it('gives the face at the place of an agent in its workflow, so that no two of them share one', () => {
    const looks = facePresets.map((_, place) => faceOf('same-key', rules, place))

    expect(new Set(looks.map((look) => JSON.stringify({ ...look, phase: 0 }))).size).toBe(
      facePresets.length,
    )
  })

  it('goes round when there are more agents than faces', () => {
    expect(faceOf('a', rules, facePresets.length).shape).toBe(faceOf('a', rules, 0).shape)
  })

  it('takes the face its key hashes to when the agent has no place, the same one each time', () => {
    expect(faceOf('persona_agent', rules)).toEqual(faceOf('persona_agent', rules))
  })

  it('keeps the phase of each agent its own, so that two agents with one face do not blink together', () => {
    expect(faceOf('a', rules, 0).phase).not.toBe(faceOf('b', rules, 0).phase)
  })
})
