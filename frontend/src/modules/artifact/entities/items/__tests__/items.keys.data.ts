import { itemKeys } from '../items.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the lists', key: itemKeys.lists(), wider: itemKeys.all() },
  { name: 'the items of an artifact', key: itemKeys.ofArtifact('a1', {}), wider: itemKeys.lists() },
  {
    name: 'the items of an artifact at a version',
    key: itemKeys.ofArtifact('a1', { version: 2 }),
    wider: itemKeys.lists(),
  },
  {
    name: 'the items of a project',
    key: itemKeys.ofProject('p1', { kind: 'persona' }),
    wider: itemKeys.lists(),
  },
  {
    name: 'the first page of the items of a project',
    key: itemKeys.firstOfProject('p1', { kind: 'persona' }),
    wider: itemKeys.lists(),
  },
  { name: 'one item', key: itemKeys.detail('i1'), wider: itemKeys.all() },
  { name: 'the versions of an item', key: itemKeys.revisions('i1'), wider: itemKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the first page and the pages of the items of a project',
    first: itemKeys.firstOfProject('p1', {}),
    second: itemKeys.ofProject('p1', {}),
  },
  {
    name: 'the items of an artifact and of a project',
    first: itemKeys.ofArtifact('x', {}),
    second: itemKeys.ofProject('x', {}),
  },
  {
    name: 'the items of two filters',
    first: itemKeys.ofProject('p1', {}),
    second: itemKeys.ofProject('p1', { text: 'a' }),
  },
  {
    name: 'an item now and at a version',
    first: itemKeys.detail('i1'),
    second: itemKeys.detail('i1', 1),
  },
]
