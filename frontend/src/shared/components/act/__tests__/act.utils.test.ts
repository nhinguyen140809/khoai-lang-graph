import { describe, expect, it } from 'vitest'

import { acts, slotPlaces } from '../act.constants'
import { actKeys, slots } from '../act.types'
import {
  actOf,
  courseShift,
  depthScale,
  drawnActsOf,
  isDrawnAct,
  moodOf,
  orbitPoint,
  toneOf,
  wayOf,
} from '../act.utils'
import catalog from '../acts.catalog.json' with { type: 'json' }

describe('the acts', () => {
  it('have the keys of the catalog of the workflow definition', () => {
    expect([...actKeys].sort()).toEqual(catalog.acts.map(({ key }) => key).sort())
  })

  it('stand in slots that have a place and a look', () => {
    for (const act of Object.values(acts)) {
      for (const { slot } of act.props) expect(slotPlaces[slot]).toBeDefined()
      for (const [, slot] of act.look) expect(slots).toContain(slot)
    }
  })

  it('go round: the look ends where it starts, and each thing is within the round', () => {
    for (const act of Object.values(acts)) {
      expect(act.look[0]?.[0]).toBe(0)
      expect(act.look.at(-1)?.[0]).toBe(1)
      expect(act.look[0]?.[1]).toBe(act.look.at(-1)?.[1])
      for (const { from, to } of act.props) {
        expect(from).toBeGreaterThanOrEqual(0)
        expect(to).toBeLessThanOrEqual(1)
        expect(to).toBeGreaterThan(from)
      }
    }
  })
})

describe('the acts of the catalog', () => {
  it('are all drawn', () => {
    expect(actKeys.filter((key) => !isDrawnAct(key))).toEqual([])
  })

  it('put things that are in their stretch, with copies that are whole', () => {
    for (const act of Object.values(acts)) {
      for (const { from, to, copies, courseCycles, effectCycles } of act.props) {
        expect(to).toBeGreaterThan(from)
        expect(Number.isInteger(copies ?? 1)).toBe(true)
        expect(courseCycles ?? 1).toBeGreaterThan(0)
        expect(effectCycles ?? 1).toBeGreaterThan(0)
      }
    }
  })

  it('name what each thing is, one of an icon, some words, or the other agent', () => {
    for (const act of Object.values(acts)) {
      for (const prop of act.props) {
        const parts = [prop.icon, prop.tokens, prop.partner].filter((part) => part !== undefined)
        expect(parts).toHaveLength(1)
      }
    }
  })

  it('leave the mood to the work, naming one only for a hard problem or a thing done well', () => {
    const named = Object.entries(acts)
      .filter(([, act]) => act.mood !== undefined)
      .map(([key]) => key)

    expect(named.sort()).toEqual(['analyze', 'calculate', 'save'])
  })

  it('turn the two bubbles of an interview to opposite sides, one after the other', () => {
    const bubbles = (acts.interview?.props ?? []).filter((prop) => prop.icon === 'message')

    expect(bubbles).toHaveLength(2)
    expect(bubbles.map(({ flip }) => flip === true)).toEqual([false, true])
    expect(bubbles[1]?.from).toBeGreaterThan((bubbles[0]?.to ?? 1) - 0.2)
  })

  it('have no words in the act that analyzes, and one question mark in the act that asks', () => {
    expect(acts.analyze?.props.some((prop) => prop.tokens !== undefined)).toBe(false)
    expect(acts.question?.props.map((prop) => prop.tokens)).toEqual([['?']])
  })

  it('give each face move a cycle that is a whole number', () => {
    for (const act of Object.values(acts)) {
      if (act.move !== undefined) expect(Number.isInteger(act.move.cycles)).toBe(true)
    }
  })
})

describe('drawnActsOf', () => {
  it('keeps the keys of the acts that are drawn, in their order', () => {
    expect(drawnActsOf(['write', 'read', 'nothing', 'typing'])).toEqual(['write', 'read', 'typing'])
  })

  it('knows a key that is in the catalog, and a key that is not', () => {
    expect(isDrawnAct('write')).toBe(true)
    expect(isDrawnAct('nothing')).toBe(false)
  })
})

describe('actOf', () => {
  it('gives the act of a key, or none', () => {
    expect(actOf('write')).toBe(acts.write)
    expect(actOf(null)).toBeNull()
  })
})

describe('moodOf', () => {
  it('gives the mood that is given, which the act does not change', () => {
    expect(moodOf('waiting', acts.write ?? null)).toBe('waiting')
    expect(moodOf('worried', null)).toBe('worried')
  })

  it('gives way to the mood of the act for the mood of work in general', () => {
    expect(moodOf('working', acts.analyze ?? null)).toBe('thinking')
    expect(moodOf(undefined, acts.analyze ?? null)).toBe('thinking')
  })

  it('keeps the mood of work in general when the act has none or there is no act', () => {
    expect(moodOf('working', null)).toBe('working')
    expect(moodOf(undefined, null)).toBe('working')
  })
})

describe('orbitPoint', () => {
  const place = { x: 0.66, y: 0 }
  const flat = { tilt: 0, turn: 0, reach: 1 }

  it('starts at its place and comes back to it after a turn', () => {
    for (const value of [0, 1]) {
      const point = orbitPoint(value, place, flat)

      expect(point.x).toBeCloseTo(0)
      expect(point.y).toBeCloseTo(0)
    }
  })

  it('goes to the other side of the face half a turn on', () => {
    const point = orbitPoint(0.5, place, flat)

    expect(point.x).toBeCloseTo(-2 * place.x)
  })

  it('shows a thing in full on a flat ring, and none of it behind the face on a leaned ring', () => {
    expect(orbitPoint(0.75, place, flat).seen).toBe(1)
    expect(orbitPoint(0.75, place, { ...flat, tilt: 60 }).seen).toBe(0)
    expect(orbitPoint(0.25, place, { ...flat, tilt: 60 }).seen).toBe(1)
  })

  it('squashes a leaned ring, and widens it with the reach', () => {
    const wide = orbitPoint(0.25, place, { ...flat, reach: 2 })
    const leaned = orbitPoint(0.25, place, { ...flat, tilt: 60 })

    expect(wide.y).toBeCloseTo(2 * place.x)
    expect(leaned.y).toBeCloseTo(place.x * Math.cos(Math.PI / 3))
  })

  it('goes round the middle of the face from a slot in the middle, by a radius of its own', () => {
    const point = orbitPoint(0.25, { x: 0, y: 0 }, flat)

    expect(Math.hypot(point.x, point.y)).toBeGreaterThan(0)
  })
})

describe('depthScale', () => {
  it('makes a thing larger toward the viewer and smaller away from them', () => {
    expect(depthScale(0)).toBe(1)
    expect(depthScale(1)).toBeGreaterThan(1)
    expect(depthScale(-1)).toBeLessThan(1)
  })
})

describe('toneOf', () => {
  it('gives the primary color to a thing whose act names none, and the color that it names otherwise', () => {
    expect(toneOf({})).toBe('primary')
    expect(toneOf({ tone: 'muted' })).toBe('muted')
  })
})

describe('the way of a course', () => {
  it('goes its own way unless the thing asks for another', () => {
    expect(wayOf(undefined, 'horizontal')).toBe('own')
    expect(wayOf('horizontal', 'horizontal')).toBe('own')
    expect(wayOf('vertical', undefined)).toBe('own')
  })

  it('turns an up and down course sideways, and a sweep up and down, when asked', () => {
    expect(wayOf('horizontal', undefined)).toBe('sideways')
    expect(wayOf('vertical', 'horizontal')).toBe('upDown')
  })

  it('shifts a thing along the way that it takes', () => {
    expect(courseShift('own', 1, 0.1, 0.2)).toEqual({ x: 0.1, y: 0.2 })
    expect(courseShift('sideways', -1, 0, 0.2)).toEqual({ x: 0.2, y: 0 })
    expect(courseShift('upDown', 1, 0.1, 0)).toEqual({ x: 0, y: 0.1 })
  })
})
