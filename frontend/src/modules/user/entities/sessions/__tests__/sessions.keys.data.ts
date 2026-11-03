import { sessionKeys } from '../sessions.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [{ name: 'the list', key: sessionKeys.list(), wider: sessionKeys.all() }]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the list and every query of the sessions',
    first: sessionKeys.list(),
    second: sessionKeys.all(),
  },
]
