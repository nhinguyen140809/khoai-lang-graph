import { describe, expect, it } from 'vitest'

import { courses, effects, entrances, exits, faceMoves } from '../act-motion.constants'

const vocabularies = {
  entrances,
  exits,
  effects,
  faceMoves,
  courses: Object.fromEntries(Object.entries(courses).map(([name, { tracks }]) => [name, tracks])),
}

describe('the motions of an act', () => {
  it('have stops that match their times, from 0 to 1 when given', () => {
    const stops = Object.values(vocabularies)
      .flatMap((named) => Object.values(named))
      .flatMap((tracks) => Object.values(tracks))

    for (const { values, times } of stops) {
      expect(values.length).toBeGreaterThanOrEqual(2)
      if (times === undefined) continue
      expect(times).toHaveLength(values.length)
      expect(times[0]).toBe(0)
      expect(times.at(-1)).toBe(1)
    }
  })

  it('bring a thing from nothing to its place on coming in, and from its place to nothing on going; but for none', () => {
    for (const [name, tracks] of Object.entries(entrances)) {
      if (name === 'none') {
        expect(tracks).toEqual({})
        continue
      }
      expect(tracks.opacity?.values[0]).toBe(0)
      expect(tracks.opacity?.values.at(-1)).toBe(1)
    }
    for (const [name, tracks] of Object.entries(exits)) {
      if (name === 'none') {
        expect(tracks).toEqual({})
        continue
      }
      expect(tracks.opacity?.values[0]).toBe(1)
      expect(tracks.opacity?.values.at(-1)).toBe(0)
    }
  })

  it('come back where they started, for the courses and effects and moves that repeat', () => {
    const repeating = [
      ...Object.values(effects),
      ...Object.values(faceMoves),
      ...Object.entries(courses)
        .filter(([name]) => name !== 'burst' && name !== 'gather')
        .map(([, { tracks }]) => tracks),
    ]
    for (const tracks of repeating) {
      for (const [name, stops] of Object.entries(tracks)) {
        // A full turn ends where it began, though its numbers do not.
        if (name === 'rotate' && stops.values.at(-1) === 360) continue
        expect(stops.values[0], name).toBeCloseTo(stops.values.at(-1) ?? NaN)
      }
    }
  })

  it('send things round the face: an orbit is worked out from the middle of the face', () => {
    expect(courses.orbit.isOrbit).toBe(true)
  })

  it('send a burst up and a gather down', () => {
    expect(courses.burst.tracks.y?.values.at(-1)).toBeLessThan(0)
    expect(courses.gather.tracks.y?.values.at(-1)).toBeGreaterThan(0)
  })
})
