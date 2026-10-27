import { noProjectFilters } from '../projects.constants'
import { projectKeys } from '../projects.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the lists', key: projectKeys.lists(), wider: projectKeys.all() },
  {
    name: 'the list of a status',
    key: projectKeys.list('archived', noProjectFilters),
    wider: projectKeys.lists(),
  },
  { name: 'the recent projects', key: projectKeys.recent(), wider: projectKeys.lists() },
  { name: 'one project', key: projectKeys.detail('p1'), wider: projectKeys.all() },
  { name: 'the creation of a project', key: projectKeys.create(), wider: projectKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the lists of two statuses',
    first: projectKeys.list('active', noProjectFilters),
    second: projectKeys.list('archived', noProjectFilters),
  },
  {
    name: 'the lists of two filters',
    first: projectKeys.list('active', noProjectFilters),
    second: projectKeys.list('active', { ...noProjectFilters, activeWithinDays: 7 }),
  },
  {
    name: 'the recent projects and one project',
    first: projectKeys.recent(),
    second: projectKeys.detail('recent'),
  },
  {
    name: 'one project and its creation',
    first: projectKeys.detail('create'),
    second: projectKeys.create(),
  },
]
