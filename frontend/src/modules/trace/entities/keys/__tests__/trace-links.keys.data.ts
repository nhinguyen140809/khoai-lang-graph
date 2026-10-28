import { traceLinkKeys } from '../trace-links.keys'
import { traceModuleKeys } from '../trace-module.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: traceLinkKeys.all(), wider: traceModuleKeys.all() },
  { name: 'the lists', key: traceLinkKeys.lists(), wider: traceLinkKeys.all() },
  {
    name: 'the links of a project',
    key: traceLinkKeys.ofProject('p1', { linkType: 'derived_from' }),
    wider: traceLinkKeys.lists(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the links of two projects',
    first: traceLinkKeys.ofProject('p1', {}),
    second: traceLinkKeys.ofProject('p2', {}),
  },
  {
    name: 'the links of two filters',
    first: traceLinkKeys.ofProject('p1', {}),
    second: traceLinkKeys.ofProject('p1', { sourceItemId: 'i1' }),
  },
]
