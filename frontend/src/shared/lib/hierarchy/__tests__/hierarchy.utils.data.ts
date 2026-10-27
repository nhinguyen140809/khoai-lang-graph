import type { Hierarchy } from '../hierarchy.types'

/** A thing that can sit under another. */
export interface Thing {
  id: string
  parent: string | null
}

export const thingHierarchy: Hierarchy<Thing> = {
  idOf: ({ id }) => id,
  parentIdOf: ({ parent }) => parent,
}

const top = { id: 's1', parent: null }
const middle = { id: 's2', parent: 's1' }
const leaf = { id: 'r1', parent: 's2' }
const sibling = { id: 'r2', parent: 's1' }

/** Things in order, with two levels of things inside the first. */
export const thingsInLevels = [top, middle, leaf, sibling]

/** The things, and whether some sit under another. */
export const nestedCases = [
  { name: 'things with others inside', things: thingsInLevels, nested: true },
  { name: 'things without a parent', things: [{ id: 'p1', parent: null }], nested: false },
  { name: 'no thing', things: [], nested: false },
]

/** A thing, and the ids of the things above it from the top level down. */
export const ancestorCases = [
  { name: 'a thing three levels deep', thing: leaf, ids: ['s1', 's2'] },
  { name: 'a thing at the top level', thing: top, ids: [] },
  {
    name: 'a thing whose parent is not among the things',
    thing: { id: 'x', parent: 'missing' },
    ids: [],
  },
]

/** A thing, and the ids of the things inside it at any depth. */
export const descendantCases = [
  { name: 'a thing with a thing and two others inside', thing: top, ids: ['s2', 'r2', 'r1'] },
  { name: 'a thing with one thing inside', thing: middle, ids: ['r1'] },
  { name: 'a thing with nothing inside', thing: leaf, ids: [] },
]

/** Things in order, and the ids of the nested result: each top-level thing with its children. */
export const nestedResultCases = [
  {
    name: 'things in levels',
    things: thingsInLevels,
    result: [
      {
        id: 's1',
        children: [
          { id: 's2', children: [{ id: 'r1', children: [] }] },
          { id: 'r2', children: [] },
        ],
      },
    ],
  },
  {
    name: 'a thing whose parent is not among the things',
    things: [{ id: 'x', parent: 'missing' }],
    result: [{ id: 'x', children: [] }],
  },
  { name: 'no thing', things: [], result: [] },
]
