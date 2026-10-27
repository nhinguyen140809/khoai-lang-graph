import { describe, expect, it } from 'vitest'

import type { Nested } from '../hierarchy.types'
import { ancestorsOf, descendantsOf, isNested, toNested } from '../hierarchy.utils'
import {
  ancestorCases,
  descendantCases,
  nestedCases,
  nestedResultCases,
  type Thing,
  thingHierarchy,
  thingsInLevels,
} from './hierarchy.utils.data'

/** A nested thing reduced to its id and the ids inside it. */
function shapeOf({ id, children }: Nested<Thing>): { id: string; children: unknown[] } {
  return { id, children: children.map(shapeOf) }
}

describe('isNested', () => {
  it.each(nestedCases)('tells $name', ({ things, nested }) => {
    expect(isNested(things, thingHierarchy)).toBe(nested)
  })
})

describe('ancestorsOf', () => {
  it.each(ancestorCases)('finds the things above $name', ({ thing, ids }) => {
    const found = ancestorsOf(thing, thingsInLevels.concat(thing), thingHierarchy)

    expect(found.map(({ id }) => id)).toEqual(ids)
  })
})

describe('descendantsOf', () => {
  it.each(descendantCases)('finds the things inside $name', ({ thing, ids }) => {
    expect(descendantsOf(thing, thingsInLevels, thingHierarchy).map(({ id }) => id)).toEqual(ids)
  })
})

describe('toNested', () => {
  it.each(nestedResultCases)('puts $name one inside another', ({ things, result }) => {
    expect(toNested(things, thingHierarchy).map(shapeOf)).toEqual(result)
  })
})
