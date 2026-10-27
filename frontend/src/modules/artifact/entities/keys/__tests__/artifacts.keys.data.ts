import { artifactKeys } from '../artifacts.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the lists', key: artifactKeys.lists(), wider: artifactKeys.all() },
  {
    name: 'the list of a project',
    key: artifactKeys.list('p1', { kind: 'persona_catalog' }),
    wider: artifactKeys.lists(),
  },
  { name: 'one artifact', key: artifactKeys.detail('a1'), wider: artifactKeys.all() },
  {
    name: 'the versions of an artifact',
    key: artifactKeys.revisions('a1'),
    wider: artifactKeys.all(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the lists of two projects',
    first: artifactKeys.list('p1', {}),
    second: artifactKeys.list('p2', {}),
  },
  {
    name: 'the lists of two filters',
    first: artifactKeys.list('p1', {}),
    second: artifactKeys.list('p1', { reviewStatus: 'draft' }),
  },
  {
    name: 'an artifact now and at a version',
    first: artifactKeys.detail('a1'),
    second: artifactKeys.detail('a1', 1),
  },
]
