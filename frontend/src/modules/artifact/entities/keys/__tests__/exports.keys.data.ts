import { exportKeys } from '../exports.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the lists', key: exportKeys.lists(), wider: exportKeys.all() },
  { name: 'the exports of a project', key: exportKeys.list('p1'), wider: exportKeys.lists() },
  { name: 'one export', key: exportKeys.detail('e1'), wider: exportKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the exports of two projects',
    first: exportKeys.list('p1'),
    second: exportKeys.list('p2'),
  },
  {
    name: 'the exports of a project and one export',
    first: exportKeys.list('x'),
    second: exportKeys.detail('x'),
  },
]
