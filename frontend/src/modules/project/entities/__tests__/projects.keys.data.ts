import { projectKeys } from '../projects.keys'
import { noProjectFilters } from '../utils/projects.utils'

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
