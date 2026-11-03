import { modelKeys } from '../models.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [{ name: 'the catalog', key: modelKeys.list(), wider: modelKeys.all() }]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the catalog and every query of the models',
    first: modelKeys.list(),
    second: modelKeys.all(),
  },
]
